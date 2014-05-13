# EventSource

Provide polyfill to support EventSource in browser where it is not available.
 
 * Tested in Internet Explorer 8 + 
 * Tested in Android browser 2.1 +

To run the complete **Project Test Suite** in your navigator, browse [this
site](http://testevs.amvtek.com/). Allow **sufficient time** ( ~ 5 minutes) for
the full Test Suite to run...

## Project content

### javascript/

 * Polyfill module : [eventsource.js](javascript/src/eventsource.js)
 * Jasmine Unit Tests [eventSourceSpec.js](javascript/spec/eventsourceSpec.js)

[eventsource.js](javascript/src/eventsource.js) is the main project deliverable.
It has no dependencies.

### test_server/

This server is built using python twisted framework.
