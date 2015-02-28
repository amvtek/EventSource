###########
EventSource
###########

Provide polyfill to support EventSource in browser where it is not available.
 
 * Used in production
 * Tested in Internet Explorer 8 + 
 * Tested in Android browser 2.1 +
 * `Documented`_
 * Run the `Browser test suite`_

Installing
==========

from source
~~~~~~~~~~~

Download suitable project archive (zip or tar.gz) from `release page`_

Include *dist/eventsource.js* or *dist/eventsource.min.js* in your page to use the polyfill.

Using bower package manager
~~~~~~~~~~~~~~~~~~~~~~~~~~~

To install package from **bower registry**, type ::

    bower install eventsource-polyfill

Just include *bower_components/eventsource-polyfill/dist/eventsource.js* or *bower_components/eventsource-polyfill/dist/eventsource.min.js* in your page to use the polyfill.

Using npm package manager
~~~~~~~~~~~~~~~~~~~~~~~~~

To install package from **npm registry**, type ::

    npm install eventsource-polyfill

Run the tests now
=================

With your web browser visit this `test site <http://testevs.amvtek.com/>`_

Allow **sufficient time** ( ~ 5 minutes) for the full Test Suite to run...

Project content
===============

dist/
    built version of javascript modules

javascript/
    Contains polyfill module and related unit tests

test_server/
    python server which generates *easy to test* **event stream** 

docs/
    documentation wiki

.. _Documented: https://github.com/amvtek/EventSource/wiki
.. _Browser test suite: http://testevs.amvtek.com/ 
.. _release page: https://github.com/amvtek/EventSource/releases/latest
