EventSource Polyfill
====================

Provide polyfill to support EventSource in browser where it is not available.

> -   Used in production
> -   Tested in Internet Explorer 8 +
> -   Tested in Android browser 2.1 +
> -   [Documented][]
> -   Run the [Browser test suite][]

Installing
----------

### from source

Download suitable project archive (zip or tar.gz) from [release page][]

Include in your html documents one of the following javascript file:

> -   *dist/eventsource.js*
> -   *dist/eventsource.min.js* (minified version)

### Using bower package manager

To install package from **bower registry**, type :

    bower install eventsource-polyfill

Include in your html documents one of the following javascript file:

> -   *bower\_components/eventsource-polyfill/dist/eventsource.js*
> -   *bower\_components/eventsource-polyfill/dist/eventsource.min.js* (minified version)

### Using npm package manager

To install package from **npm registry**, type :

    npm install eventsource-polyfill

Note that this package may only be used with in **browser application**.

If you are using [browserify][] , you just have to require this package in your main module…

``` sourceCode
// load (Polyfill) EventSource, in case browser does not support it...
require('eventsource-polyfill');
```

Run the tests now
-----------------

With your web browser visit this [test site][Browser test suite]

Allow **sufficient time** ( ~ 5 minutes) for the full Test Suite to run…

Project content
---------------

dist/  
    built version of javascript modules

javascript/  
    Contains polyfill module and related unit tests

test_server/  
    python server which generates *easy to test* **event stream**

docs/  
    documentation wiki

  [Documented]: https://github.com/amvtek/EventSource/wiki
  [Browser test suite]: http://testevs.amvtek.com/
  [release page]: https://github.com/amvtek/EventSource/releases/latest
  [browserify]: http://browserify.org
