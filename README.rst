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

Include in your html documents one of the following javascript file:

 * *dist/eventsource.js* 
 * *dist/eventsource.min.js* (minified version)

Using bower package manager
~~~~~~~~~~~~~~~~~~~~~~~~~~~

To install package from **bower registry**, type ::

    bower install eventsource-polyfill

Include in your html documents one of the following javascript file:

 * *bower_components/eventsource-polyfill/dist/eventsource.js*
 * *bower_components/eventsource-polyfill/dist/eventsource.min.js* (minified version)

Using npm package manager
~~~~~~~~~~~~~~~~~~~~~~~~~

To install package from **npm registry**, type ::

    npm install eventsource-polyfill

Note that this package may only be used with in **browser application**.

If you are using `browserify`_ , if in need to polyfill missing EventSource
implementation, you just have to require this package in your main module...

.. code-block:: javascript

    // load (Polyfill) EventSource, in case browser does not support it...
    require('eventsource-polyfill');

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
.. _browserify: http://browserify.org
