###########
EventSource
###########

Provide polyfill to support EventSource in browser where it is not available.
 
 * Used in production
 * Tested in Internet Explorer 8 + 
 * Tested in Android browser 2.1 +
 * `Documented`_

Installing
==========

You can get the code from bower::

    bower install eventsource-polyfill

Just include *eventsource.js* or *eventsource.min.js* in your page to use the polyfill.

Run the tests now
=================

With your web browser visit this `test site <http://testevs.amvtek.com/>`_

Allow **sufficient time** ( ~ 5 minutes) for the full Test Suite to run...

Project content
===============

javascript/
    Contains polyfill module and related unit tests

test_server/
    python server which generates *easy to test* **event stream** 

docs/
    documentation wiki

.. _Documented: https://github.com/amvtek/EventSource/wiki
