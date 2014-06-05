#  -*- coding: utf-8 -*-
import random as RND

try:
    from cStringIO import StringIO
except ImportError:
    from StringIO import StringIO

from zope.interface import implements
from twisted.protocols import basic, policies
from twisted.internet import reactor, protocol, interfaces
from twisted.internet.task import deferLater, cooperate

import log as customLog

from utils import SimpleHTTPRequest, encode_http_response, TestSource, split_by


class EventSourceRequest(SimpleHTTPRequest):

    ALLOWED_METHODS = frozenset(["GET"])

    def parse(self, httpMsg):

        super(EventSourceRequest, self).parse(httpMsg)

        if self._error is not None:
            return

        self.evsArgs = {}
        
        # continue parsing to read test parameters
        try:

            errReason = "Bad Request"
            
            # local aliases
            path = self.path
            reqArgs = self.args
            reqHeaders = self.headers

            # read seed
            errReason = "Invalid seed"
            self.evsArgs['seed'] = hash(path.rsplit('/',1)[-1])

            # read message sequence length
            errReason = "Can not parse sequence length"
            seqlength = reqArgs.get('evs_num_messages', None) or \
                        reqHeaders.get('X-EVS-Test-Num-Message'.lower(), None) or None
            self.evsArgs['length'] = int(seqlength)

            # read closeAt
            errReason = "Can not parse closeAt"
            closeAt = reqArgs.get('evs_close_at', None) or\
                      reqHeaders.get('X-EVS-Test-CloseAt'.lower(), None)
            self.evsArgs['closeAt'] = int(closeAt) if closeAt else None
            
            # read sendPreamble
            self.evsArgs['sendPreamble'] = bool(reqArgs.get('evs_preamble'))

            # read Last-Event-Id
            errReason = "Invalid Last-Event-Id"
            lastEventId = reqArgs.get('evs_last_event_id', None) or\
                          reqHeaders.get('Last-Event-Id'.lower(), None) or -1
            self.evsLastId = int(lastEventId)

        except ValueError:

            self.set_error(400, errReason)

        except:

            self.set_error(500, "Server side error")


class SimpleHTTPServerProtocol(basic.LineReceiver, policies.TimeoutMixin):

    START_EVENT_STREAM = \
            "HTTP/1.1 200 OK\r\n"\
            "Content-Type: text/event-stream\r\n"\
            "Access-Control-Allow-Origin: *\r\n"\
            "Cache-Control: no-cache\r\n"\
            "Transfert-Encoding: identity\r\n"\
            "Connection: close\r\n\r\n"

    MAX_LENGTH_ERROR = encode_http_response(413, 'Request Entity Too Large')

    MAX_REQUEST_TRANSMIT_TIME_ERROR = encode_http_response(408, 'Request Timeout')

    delimiter = "\r\n\r\n"

    request = None
    
    def __init__(self, maxLength, timeout):

        self.MAX_LENGTH = maxLength
        self.MAX_REQUEST_TRANSMIT_TIME = timeout

    def lineLengthExceeded(self, line):

        self.log.msg("request too large, disconnecting")
        self.sendError(self.MAX_LENGTH_ERROR)

    def connectionMade(self):
        
        self.setTimeout(self.MAX_REQUEST_TRANSMIT_TIME)
        
        self.log = customLog.getLogger(self.transport.logstr)
        self.log.msg('connectionMade')

    def timeoutConnection(self):

        self.log.msg("request transmission takes too long, timing out")
        self.sendError(self.MAX_REQUEST_TRANSMIT_TIME_ERROR)

    def connectionLost(self, reason=None):

        self.log.msg('Connection closed because %s' % reason)
        if hasattr(self, 'producer'):
            self.producer.stopProducing()

    def lineReceived(self, line):
        """parse incoming http request, and start streaming..."""

        self.log.msg("received HTTP request, attending to parse it")
        self.resetTimeout()
        
        self.request = EventSourceRequest(line)

        if self.request._error is not None:

            self.log.msg("Got HTTP error %(status)s" % self.request._error)
            self.sendError(self.request.error)

        else:

            # send response headers
            self.startResponse()

            # register EventSource producer
            self.producer = CooperativePushProducer(self.buildEventStream())
            self.transport.registerProducer(self.producer, True)
            d = self.producer.whenDone()
            d.addCallback(lambda _: self.transport.loseConnection())

    def sendError(self, error):
        """send error response and close connection"""

        self.transport.write(error)
        self.transport.loseConnection()

    def startResponse(self):
        """send response that starts EventSource stream..."""

        self.transport.write(self.START_EVENT_STREAM)

    def buildEventStream(self):

        lastEvtId = self.request.evsLastId

        evtSource = TestSource(messages=self.factory.messages, **self.request.evsArgs)
        evtSequence = evtSource.visit_from(lastEvtId+1)

        if lastEvtId > -1:

            self.log.msg("restart streaming from : %d" % lastEvtId)

        else:

            self.log.msg("new eventsource stream...")

        restart = lambda: None

        for message in evtSequence:

            # extract start of message...
            msgstart = message[:message.find(":", 0, 8)+12]
            self.log.msg("new event line : %s..." % msgstart)

            for part in split_by(message, RND.randint(1, 3)):
                self.transport.write(part)
                yield deferLater(reactor, RND.uniform(0.05, 0.3), restart)


class CooperativePushProducer(object):

    implements(interfaces.IPushProducer)

    def __init__(self, iterator):

        self.task = cooperate(iterator)

    def getTaskState(self):

        return self.task._completionState

    def whenDone(self):

        return self.task.whenDone()

    def pauseProducing(self):

        self.task.pause()

    def resumeProducing(self):

        self.task.resume()

    def stopProducing(self):

        if self.task._completionState is None:

            self.task.stop()


class SimpleHTTPServerProtocolFactory(protocol.Factory):

    def __init__(self):

        self.MAX_LENGTH = 100000
        self.MAX_REQUEST_TRANSMIT_TIME = 20000  # seconds
        self.messages = None

    def buildProtocol(self, addr):

        proto = SimpleHTTPServerProtocol(self.MAX_LENGTH, self.MAX_REQUEST_TRANSMIT_TIME)
        proto.factory = self
        return proto

if __name__ == "__main__":

    import doctest
    doctest.testmod()
