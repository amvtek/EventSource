#  -*- coding: utf-8 -*-

from zope.interface import implements

from twisted.application.service import IServiceMaker
from twisted.application import internet
from twisted.plugin import IPlugin
from twisted.python import usage

from evsutils.protocol import SimpleHTTPServerProtocolFactory


class Options(usage.Options):

    optParameters = [
        ['host', 'h', '0.0.0.0', "host"],
        ['port', 'p', 7676, "port"]
    ]


class TestEventsourceServiceMaker(object):

    implements(IServiceMaker, IPlugin)
    tapname = "test_eventsource"
    description = "test eventsource"
    options = Options

    def makeService(self, options):

        return internet.TCPServer(int(options["port"]), SimpleHTTPServerProtocolFactory())

serviceMaker = TestEventsourceServiceMaker()