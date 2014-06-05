#  -*- coding: utf-8 -*-

from urlparse import urlparse, parse_qsl
from rfc822 import Message as MimeMessage
import random as RND
import json

try:
    from cStringIO import StringIO
except ImportError:
    from StringIO import StringIO

import log as customLog


def encode_http_response(
        status, reason, version="HTTP/1.1",
        headers=None, entity=None, **kwargs):
    """return http message encoding response"""

    buf = []

    # 'dictify' headers
    headers = dict(headers or [])

    # add status line
    buf.append("%s %i %s\r\n" % (version, status, reason))

    # add entity description in headers
    if entity:
        headers["Content-Length"] = len(entity)
        headers.setdefault("Content-Type", "text/plain")

    # render headers
    for name, value in headers.items():
        buf.append("%s: %s\r\n" % (name.title(), value))

    # add empty line
    buf.append("\r\n")

    if entity:
        buf.append(entity)

    return "".join(buf)


class SimpleHTTPRequest(object):
    """Simple HTTPRequest object to help parsing HTTP message"""

    ALLOWED_METHODS = frozenset([
        "OPTIONS", "GET", "HEAD", "POST",
        "PUT", "DELETE", "TRACE", "CONNECT"])

    method = None
    path = None
    headers = {}
    version = None
    args = None

    _error = None

    def __init__(self, httpMsg):
        """
        >>> reqText = "GET /path/to/my/eventsource?arg1=1&arg2=2 HTTP/1.1\\r\\nheader: 3\\r\\n\\r\\n"
        >>> req = SimpleHTTPRequest(reqText)
        >>> req.path, req.args, req.method, req.version, req.headers
        ('/path/to/my/eventsource', {'arg1': '1', 'arg2': '2'}, 'GET', (1, 1), {'header': '3'})
        """

        self.log = customLog.getLogger('Processing HTTP request')
        try:
            self.parse(httpMsg)
        except:
            self.set_error(400, "Bad Request")

    def parse(self, httpMsg):
        """parse and validate http request out of httpMsg"""

        f = StringIO(httpMsg)

        # parse request line
        reqline = f.readline()
        parts = reqline.split()

        if len(parts) == 3:

            method, path, version = parts

        elif len(parts) == 2:

            method, path = parts
            version = "HTTP/0.9"

        else:

            return self.set_error(400, "Invalid Request line")

        # validates method
        method = method.strip().upper()
        if method not in self.ALLOWED_METHODS:
            hdrs = {"Allow": ", ".join(self.ALLOWED_METHODS)}
            return self.set_error(405, "Method Not Allowed", hdrs)
        self.method = method

        # validates path
        self.path = urlparse(path).path
        self.args = dict(parse_qsl(urlparse(path).query))

        # validates version
        version = version.strip().upper()
        if not version.startswith("HTTP/"):

            return self.set_error(400, "Invalid HTTP version")
        majmin = version[5:].split(".")
        try:
            major, minor = [int(v) for v in majmin]
        except:

            return self.set_error(400, "Invalid HTTP version")
        self.version = (major, minor)

        # parse headers
        self.headers = dict(MimeMessage(f))
        self.log.msg('\nFound headers: {}'.format(self.headers))

    def set_error(self, status, reason, headers=None, entity=None):
        """helper method allowing to define 'shortcut' response"""

        status = int(status)
        self._error = locals()

    def get_error(self):
        """return string encoding error response if any"""

        if self._error:
            return encode_http_response(**self._error)
    error = property(get_error)

    def has_error(self):
        """return True if request is not valid"""

        return bool(self._error)


class TestSource(object):

    lineSep = ['\n', '\r', '\r\n']

    messages = [u'one line. one',
                u'two lines. one\ntwo lines. two',
                u'three lines. one\nthree lines. two\nthree lines. three',
                u'four lines. one\nfour. two\nfour lines. three\nfour lines. four',
                u'spam, ham and eggs',
                u"spam, șuncă și ouă",
                u'spam\nham\neggs',
                u'Nobody expects the spanish inquisition',
                u"Personne ne s'attend à l'Inquisition espagnole",
                u'always look on the bright side of bugs',
                u"toujours regarder le côté lumineux de bugs"]

    def __init__(self, seed, length, closeAt=None,
                 sendPreamble=False, messages=None):
        """
        test if we can recreate the exact scenario with the same seed
        >>> source1 = TestSource(2014, 2)
        >>> source2 = TestSource(2014, 2)
        >>> source1.sequence == source2.sequence
        True
        """

        RND.seed(seed)
        self.sendPreamble = sendPreamble
        self.length = int(length)
        self.closeAt = closeAt
        self.messages = [unicode(mess) for mess in messages or self.messages]
        self.chosenLnSep = RND.choice(self.lineSep)

        # self.chosenEvtSep = RND.choice(self.lineSep).rjust(RND.randint(2, 10))
        self.chosenEvtSep = self.chosenLnSep  # RND.choice(self.lineSep)
        self.sequence = ["Message %02i%s" %
                         (n, RND.choice(self.messages))
                         for n in xrange(self.length)]
        self.encoder = EventSourceEncoder(self.chosenLnSep, self.chosenEvtSep)

    def visit_from(self, fromId=0):
        """
        generator function, let us iterate sequence from identifier

        helper lambda to simulate event encoding
        >>> ev = lambda mylist, sep: ["%s%s" % (el, sep) for el in mylist]

        start from fromId=0 to closeAt=1
        >>> source = TestSource(2014, 10, 1)  # closeAt is 1
        >>> source.sequence = [1, 2, 3]

        >>> actual = list(source.visit_from())
        >>> sep = source.chosenLnSep + source.chosenEvtSep
        >>> expected = ev(['event: testmeta\\ndata: [1, 2, 3]', 'data: 1\\nid: 1'], sep)
        >>> actual == expected
        True

        start from fromId=7 to closeAt=4
        >>> source = TestSource(2014, 10, 4)  # closeAt is 4
        >>> source.sequence = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10]

        >>> actual = list(source.visit_from(7))
        >>> sep = source.chosenLnSep + source.chosenEvtSep
        >>> expected = ev(['data: 7\\nid: 7', 'data: 8\\nid: 8'], sep)
        >>> actual == expected
        True

        start from fromId=7 to closeAt=10
        >>> source = TestSource(2014, 10)  # to the end
        >>> source.sequence = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10]

        >>> actual = list(source.visit_from(7))
        >>> sep = source.chosenLnSep + source.chosenEvtSep
        >>> expected = ev(['data: 7\\nid: 7', 'data: 8\\nid: 8', 'data: 9\\nid: 9', 'data: 10\\nid: 10', 'event: testend\\ndata: This is the end'], sep)
        >>> actual == expected
        True

        start from fromId=5 to closeAt=4
        >>> source = TestSource(2014, 8, 4)  # to the end
        >>> source.sequence = [1, 2, 3, 4, 5, 6, 7, 8]

        >>> actual = list(source.visit_from(5))
        >>> sep = source.chosenLnSep + source.chosenEvtSep
        >>> expected = ev(['data: 5\\nid: 5', 'data: 6\\nid: 6', 'data: 7\\nid: 7',  'data: 8\\nid: 8', 'event: testend\\ndata: This is the end'], sep)
        >>> actual == expected
        True

        tart from fromId=5 to closeAt=4
        >>> source = TestSource(2014, 16, 4)  # to the end
        >>> source.sequence = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16]

        >>> actual = list(source.visit_from(5))
        >>> sep = source.chosenLnSep + source.chosenEvtSep
        >>> expected = ev(['data: 5\\nid: 5', 'data: 6\\nid: 6', 'data: 7\\nid: 7', 'data: 8\\nid: 8'], sep)
        >>> actual == expected
        True
        """

        fromId = int(fromId)
        encoder = self.encoder
        sequence = self.sequence
        closeAt = self.closeAt
        encode = encoder.encode_event
        sendPreamble = self.sendPreamble

        events = [encode(message, None, index+1) for index, message in enumerate(sequence)]
        events.insert(0, encode(json.dumps(sequence), 'testmeta', 0))
        events.append(encode("This is the end", 'testend'))

        if sendPreamble:
            yield encoder.encode_preamble()

        seqEnd = fromId - fromId % closeAt + closeAt + 1 if closeAt else len(events)+1
        seqEnd = seqEnd if seqEnd < len(events)-1 else len(events)

        for event in events[fromId:seqEnd]:
            yield event


class EventSourceEncoder(object):

    preamble = "mypreamble"

    def __init__(self, linesep='\n', eventsep='\n'):
        self.linesep = linesep
        self.eventsep = eventsep

    def encode_preamble(self, size=2056):
        """
        return preamble comment aiming at resetting IE 8 9 XDomainRequest

        >>> EventSourceEncoder().encode_preamble(15)
        ':mypreamble    \\n'
        """

        return (u"%s%s" % ((":%s" % self.preamble).ljust(size), self.linesep)).encode('utf-8')

    def encode_comment(self, comment):
        """
        return comment line

        >>> EventSourceEncoder().encode_comment('spam, ham and eggs')
        u': spam, ham and eggs\\n'
        """

        return u": %s%s" % (comment, self.linesep)

    def encode_mark(self, evtId):
        """
        return line encoding event id

        >>> EventSourceEncoder().encode_mark(2014)
        u'id: 2014\\n'
        """

        return u"id: %s%s" % (evtId, self.linesep)

    def encode_name(self, evtName):
        """
        return line encoding event name

        >>> EventSourceEncoder().encode_name('myevent')
        u'event: myevent\\n'
        """
        return u'event: %s%s' % (evtName, self.linesep)

    def encode_data(self, datas):
        ur"""
        return lines encoding event data

        >>> datas = 'first data\nsecond data\nthird data'
        >>> EventSourceEncoder().encode_data(datas)
        u'data: first data\ndata: second data\ndata: third data\n'

        >>> datas = u"toujours regarder le côté lumineux de bugs"
        >>> EventSourceEncoder().encode_data(datas)
        u'data: toujours regarder le c\xf4t\xe9 lumineux de bugs\n'
        """

        return "data: %s%s" % (("%sdata: " % self.linesep).join(unicode(datas).splitlines()), self.linesep)

    def encode_event(self, datas, evtName=None, evtId=None):
        """
        return block encoding event

        >>> datas = 'first data\\nsecond data'
        >>> EventSourceEncoder().encode_event(datas, 'myevent', 2014)
        'event: myevent\\ndata: first data\\ndata: second data\\nid: 2014\\n\\n'

        >>> datas = 'only one line of data'
        >>> EventSourceEncoder().encode_event(datas)
        'data: only one line of data\\n\\n'
        """

        return (u"%s%s%s%s" % (
            self.encode_name(evtName) if evtName else '',
            self.encode_data(datas),
            self.encode_mark(evtId) if evtId else '',
            self.eventsep
        )).encode('utf-8')


def split_by(msg, n):
    """
    return msg divided in nchunk if msg size allow so...

    >>> split_by('123456789', 3)
    ['123', '456', '789']

    >>> split_by('123456789', 2)
    ['1234', '56789']

    >>> split_by('12345', 2)
    ['12', '345']

    >>> len(split_by('123456789', 4))
    4

    Generate all randomly(msg, msg length and pieces)
    and check if the final length matches
    >>> import random,string
    >>> pieces = random.randint(1, 20)
    >>> len(split_by(''.join(random.choice(string.ascii_uppercase) for i in range(random.randint(1, 100))), pieces)) == pieces
    True
    """

    return [(msg[len(msg)*i//n:len(msg)*(i+1)//n]) for i in range(n)]


if __name__ == "__main__":

    import doctest
    doctest.testmod()
