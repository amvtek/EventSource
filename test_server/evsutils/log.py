# -*- coding: utf-8 -*-
"""
    shared.log
    ~~~~~~~~~~

    AmvTek attend to take control of twisted logging

    :copyright: (c) 2012 by sc AmvTek srl
    :email: devel@amvtek.com
"""

import sys

from logging import DEBUG,INFO,WARNING,ERROR,FATAL

from zope.interface import implements
from twisted.python import context, log as _log


ILogContext = _log.ILogContext
_FileLogObserver = _log.FileLogObserver  # local alias


class LeveledOnlyFileLogObserver(_FileLogObserver):
    """
    FileLogObserver that filters out non 'leveled' log events...
    This is our attend to eliminate unwanted twisted log messages...
    """

    def emit(self,eventDict):
        """skip logging if eventDict does not contain 'level' key..."""

        if eventDict.get('isError') or eventDict.has_key('level'):
            return _FileLogObserver.emit(self, eventDict)


def setLeveledLogging():
    """
    monkey patch twisted.python.log.FileLogObserver so that 'unleveled' log
    events are ignored...
    """
    _log.FileLogObserver = LeveledOnlyFileLogObserver


def buildContextAwareLogPrefix(prefix):
    """
    return logPrefix callable that :
        appends context retrieved 'system' to set prefix
    """

    def logPrefix():
        "logPrefix that adjust to current context"

        logCtx = context.get('system',"-")
        if logCtx is not "-":
            return "%s,%s"%(logCtx,prefix)
        return prefix

    return logPrefix


class LogPublisher(object):

    minLevel = DEBUG

    defaultLevel = INFO

    def _msg(self,*args,**kwargs):
        "wraps twisted.log.msg..."

        _log.msg(*args,**kwargs)

    def _err(self,_stuff=None,_why=None,**kwargs):
        "wraps twisted.log.err..."

        _log.err(_stuff,_why,**kwargs)

    def debug(self,*args,**kwargs):
        "bypass twisted log.msg in case DEBUG below minLevel..."

        if DEBUG >= self.minLevel:
            kwargs['level'] = DEBUG
            self._msg(*args,**kwargs)

    def msg(self,*args,**kwargs):
        "bypass twisted log.msg in case level below minLevel..."

        level = kwargs.setdefault('level',self.defaultLevel)
        if level >= self.minLevel:
            self._msg(*args,**kwargs)

    log = msg

    def err(self,_stuff=None,_why=None,**kwargs):
        """
        bypass twisted log.err in case level below minLevel
        uses ERROR as default for level
        """
        level = kwargs.setdefault('level',ERROR)
        if level >= self.minLevel:
            self._err(_stuff,_why,**kwargs)

    def getLogger(self,logPrefix):
        "return Logger instance"

        logger = Logger()
        logger.minLevel = self.minLevel
        logger.defaultLevel = self.defaultLevel
        if callable(logPrefix):
            logger.logPrefix = logPrefix
        else:
            logger.logPrefix = lambda :logPrefix
        return logger


class Logger(LogPublisher):
    "a Logger which inline 'level aware' debug, msg, err log methods"

    def logPrefix(self):
        return "?"

    def _msg(self,*args,**kwargs):
        "add 'system' into log 'event dict'..."

        kwargs['system'] = self.logPrefix()
        _log.msg(*args,**kwargs)

    def _err(self,_stuff=None,_why=None,**kwargs):
        "add 'system' into log 'event dict'..."

        kwargs['system'] = self.logPrefix()
        _log.err(_stuff,_why,**kwargs)


def setLevel(minLevel,defaultLevel):
    "set minimum and default levels for log publishing"

    minLevel = int(minLevel)
    defaultLevel = int(defaultLevel)

    # Initializes global publisher
    thePublisher.minLevel = minLevel
    thePublisher.defaultLevel = defaultLevel

    # Initializes Logger class, this simplify inlining Logger
    Logger.minLevel = minLevel
    Logger.defaultLevel = defaultLevel

# Install global LogPublisher
thePublisher = LogPublisher()
debug = thePublisher.debug
msg = thePublisher.msg
err = thePublisher.err
getLogger = thePublisher.getLogger

# Add globals to ease replacing twisted.python.log with this module
callWithContext = _log.callWithContext
callWithLogger = _log.callWithLogger

startConsoleLogging = lambda :_log.startLogging(sys.stdout)
