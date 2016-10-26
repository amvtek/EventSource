/*
   * CommonJS module that exports EventSource polyfill version 0.9.7
   * This module is intended for browser side use
   * =====================================================================
   * THIS IS A POLYFILL MODULE, SO IT HAS SIDE EFFECTS
   * IT AUTOMATICALLY CHECKS IF window OBJECT DEFINES EventSource
   * AND ADD THE EXPORTED ONE IN CASE IT IS UNDEFINED
   * =====================================================================
   * Supported by sc AmvTek srl
   * :email: devel@amvtek.com
 */


var PolyfillEventSource = require('./eventsource.js').EventSource;
module.exports = PolyfillEventSource;

// Add EventSource to window if it is missing...
if (window && !window.EventSource){
    window.EventSource = PolyfillEventSource;
    // Don't break IE < 10
    if (typeof console !== "undefined" && typeof console.log !== "undefined"){
        console.log("polyfill-eventsource added missing EventSource to window");
    }
}
