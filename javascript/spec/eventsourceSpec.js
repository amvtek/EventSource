/**
 * Created by vasi on 4/8/14.
 */

var evsName = "EventSource",
    evsImportName = (window._eventSourceImportPrefix || '') + evsName,
    isEventSourceSupported = (window["EventSource"] != undefined);

describe("Testing EventSource polyfill with MockupXHR", function() {

    var previousXHR;

    beforeEach(function() {

        var mockupXHR = function(evs) {

            this.responseText = '';
            this.evs = evs;
        };

        mockupXHR.prototype = {

            useXDomaineRequest: false,

            _request: null,

            _failed: false,

            isReady: function() {

                return true;
            },

            isDone: function() {

                return false;
            },

            hasError: function() {

                return (this._failed);
            },

            getBuffer: function() {

                return this.responseText;
            },

            abort: function() {

                this.responseText = '';
            },

            sendData: function(str) {

                this.responseText += str;
                this.evs.ondata();
            }
        };

        this.eventSource = window[evsImportName];
        previousXHR = this.eventSource.prototype.XHR;
        this.eventSource.prototype.XHR = mockupXHR;
    });

    afterEach(function () {
        this.eventSource.prototype.XHR = previousXHR;
    });

    describe("Provide MockupXHR class to ease testing the EventSource class", function() {
        var evs;

        beforeEach(function (done) {

            evs = new this.eventSource('http://exampleLoadMockupXHR.com');
            setTimeout(function () {
                done();
            }, 0);
        });

        afterEach(function (){

            evs.close();
        });

        it("should load mockupXHR instead of native XHR", function() {
            // the prefix is set in SpecRunner.html

            expect(evs._xhr.sendData).toBeDefined();
        });
    });

    describe("Setting up the polyfill EventSource for it to be available alongside browser native EventSource", function() {

        it("When no options object is passed to the EventSource constructor, all option in EventSource.prototype.defaultOptions are set.", function() {
            // the prefix is set in SpecRunner.html

            var evs = new this.eventSource('http://example.com');
            var expected = evs.defaultOptions;  // in this test we expect all options to be the default ones

            var actual = {
                loggingEnabled: evs.loggingEnabled,
                loggingPrefix: evs.loggingPrefix,
                interval: evs.interval,
                bufferSizeLimit: evs.bufferSizeLimit, // bytes
                silentTimeout: evs.silentTimeout, // milliseconds
                getArgs: evs.getArgs,
                xhrHeaders: evs.xhrHeaders
            };

            expect(actual).toEqual(expected);

            evs.close();
        });

        it("When options is passed to constructor, all option not defined in defaultOptions are ignored.", function() {
            // the prefix is set in SpecRunner.html

            var extraOptions = {
                extraOption: 1000
            };
            var evs = new this.eventSource('http://example.com', extraOptions);

            expect(evs.extraOption).toBeUndefined();

            evs.close();
        });

        it("When options is passed to constructor, option defined in defaultOptions are over written.", function() {
            // the prefix is set in SpecRunner.html

            var options = {
                interval: 1000,
                bufferSizeLimit: 256*1024 // bytes
            };

            var evs = new this.eventSource('http://example.com', options);
            var defaults = evs.defaultOptions;

            var expected = {
                interval: options.interval,
                bufferSizeLimit: options.bufferSizeLimit,
                silentTimeout: defaults.silentTimeout, // milliseconds
                getArgs: defaults.getArgs,
                xhrHeaders: defaults.xhrHeaders
            };

            var actual = {
                interval: evs.interval,
                bufferSizeLimit: evs.bufferSizeLimit, // bytes
                silentTimeout: evs.silentTimeout, // milliseconds
                getArgs: evs.getArgs,
                xhrHeaders: evs.xhrHeaders
            };

            expect(actual).toEqual(expected);

            evs.close();
        });
    });

    describe("tests for urlWithParams", function() {

        it("When the baseURL already contains arguments, the rest of evs arguments are appended.", function() {

            var params =  {
                a: 1,
                b: 2
            };
            var evs = new this.eventSource('http://example.com?ciao=ola');
            var urlWithParams = evs.urlWithParams;
            expect(urlWithParams('http://example.com?ciao=ola', params)).toBe('http://example.com?ciao=ola&a=1&b=2');
        })

        it("When called with a null or undefined params, baseUrl is returned.", function() {
            // the prefix is set in SpecRunner.html

            var evs = new this.eventSource('http://exampleurlWithParams.com');
            var urlWithParams = evs.urlWithParams;
            expect(urlWithParams('http://example.com')).toBe('http://example.com');
        });

        it("When called with a params object that contains no attribute but has a prototype with attributes, baseUrl is returned.", function() {
            // the prefix is set in SpecRunner.html

            var Params = function () {};
            Params.prototype = {
                'a': 1,
                'b': 2
            };
            var evs = new this.eventSource('http://exampleurlWithParams.com');
            var urlWithParams = evs.urlWithParams;
            expect(urlWithParams('http://example.com', new Params())).toBe('http://example.com');
        });

        it("When called with a params that define arguments, those are added to the url", function() {
            // the prefix is set in SpecRunner.html

            var params =  {
                a: 1,
                b: 2
            };
            var evs = new this.eventSource('http://exampleurlWithParams.com');
            var urlWithParams = evs.urlWithParams;
            expect(urlWithParams('http://example.com', params)).toBe('http://example.com?a=1&b=2');
        });
    });

    describe("tests for lastLineIndex", function() {

        it("returns correct lastMessageIndex in case of \\n\\n", function() {
            // the prefix is set in SpecRunner.html

            var evs = new this.eventSource('http://exampleurlWithParams.com');
            var lastLineIndex = evs.lastMessageIndex;
            expect(lastLineIndex("0123\r\r678\n\n9")).toEqual([9, 11]);
        });

        it("returns correct lastLineIndex in case of \\r\\r", function() {
            // the prefix is set in SpecRunner.html

            var evs = new this.eventSource('http://exampleurlWithParams.com');
            var lastLineIndex = evs.lastMessageIndex;
            expect(lastLineIndex("0123\n\n678\r\r")).toEqual([9, 11]);
        });

        it("returns correct lastLineIndex in case of \\r\\n\\r\\n", function() {
            // the prefix is set in SpecRunner.html

            var evs = new this.eventSource('http://exampleurlWithParams.com');
            var lastLineIndex = evs.lastMessageIndex;
            expect(lastLineIndex("0123\n\n67\r\n\r\n")).toEqual([8, 12]);
        });
    });

    describe("tests for trimWhiteSpace", function() {

        it("should remove whitespace left and right of the string", function () {
            // the prefix is set in SpecRunner.html

            var evs = new this.eventSource('http://exampleurlWithParams.com');
            var trimWhiteSpace = evs.trimWhiteSpace;
            expect(trimWhiteSpace("       text between spaces    ")).toBe('text between spaces');
        });
    });

    describe("tests for normalizeToLF", function() {

        it("should replace CR and CRLF with LF(\\n) inside a string", function () {
            // the prefix is set in SpecRunner.html

            var evs = new this.eventSource('http://example.com');
            var normalizeToLF = evs.normalizeToLF;

            var str = "LF:\n. CR:\r. CRLF:\r\n. and again LF:\n. CR:\r. CRLF:\r\n. Double CR:\r\r. Double CRLF:\r\n\r\n";
            var expectedStr = "LF:\n. CR:\n. CRLF:\n. and again LF:\n. CR:\n. CRLF:\n. Double CR:\n\n. Double CRLF:\n\n";
            var actualStr = normalizeToLF(str);

            expect(actualStr).toBe(expectedStr);

            evs.close();
        });
    });

    describe("Simulates EventSource stream using MockupXHR", function() {

        var evs, recievedMessageEvents, recievedOpenEvents, recievedErrorEvents;

        beforeEach(function (done) {

            evs = new this.eventSource('http://exampleSimulatesEventSourceWithMockupXHR.com');
            recievedMessageEvents = [];
            recievedOpenEvents = [];
            recievedErrorEvents = [];
            evs.addEventListener('message', function(e) {
                recievedMessageEvents.push(e.data);
            }, false);
            evs.addEventListener('open', function(e) {
                recievedOpenEvents.push(e.type);
            }, false);
            evs.addEventListener('error', function(e) {
                recievedErrorEvents.push(e.type);
            }, false);

            setTimeout(function () {
                done();
            }, 0)
        });

        afterEach(function (done) {
            evs.close();
            done();
        });

        it("check that Mockup XHR is used", function () {

            expect(evs._xhr.sendData).toBeDefined();
        });

        it("Initial BOM mark is skipped", function () {

            evs._xhr.sendData('\ufeffdata: "First line of data."\r\r');
            var expectedEvents = ['"First line of data."'];
            expect(recievedMessageEvents).toEqual(expectedEvents);
        });

        it("Multiline message are properly reassembled", function () {

            evs._xhr.sendData('data: "First line of data."\ndata: "Second line of data."\r\r');
            var expectedEvents = ['"First line of data."\n"Second line of data."'];
            expect(recievedMessageEvents).toEqual(expectedEvents);
        });

        it("Chunky transmissions are properly buffered", function () {

            evs._xhr.sendData('data: "First line of data."\ndata: "Second line of data."\n\ndata: "First part of broken message.');
            evs._xhr.sendData('Second part of broken message."\n\n');
            var expectedEvents = ['"First line of data."\n"Second line of data."', '"First part of broken message.Second part of broken message."'];
            expect(recievedMessageEvents).toEqual(expectedEvents);
        });

        it("id lines are properly processed", function () {

            var expectedEventId = '1983';
            evs._xhr.sendData('data: "First line of data."\ndata: "Second line of data."\n\ndata: "First part of broken message.');
            evs._xhr.sendData('Second part of broken message."\n\nid: '+expectedEventId+'\ndata: "Message with new id"\n\n');
            expect(evs.lastEventId).toEqual(expectedEventId);
        });

        it("option bufferSizeLimit is taken into account", function () {

            evs.bufferSizeLimit = 100;
            evs._xhr.sendData('data: "First line of data."\ndata: "Second line of data."\n\ndata: "First part of broken message.');
            evs._xhr.sendData('Second part of broken message."\n\nid: 1983\rdata: "Message with new id"\n\n');
            evs._xhr.sendData('data: "Message to force dispatching the open event"\n\n');
            var expectedOpenEvents = ["open", "open"];
            expect(recievedOpenEvents).toEqual(expectedOpenEvents);
        });

        describe("Manually ticking the Jasmine Clock to produce a sleep until events are fired:", function () {

            var previous = 0;

            beforeEach(function() {

                previous = evs.silentTimeout;
                jasmine.clock().install();
            });

            afterEach(function(done) {

                evs.silentTimeout = previous;
                jasmine.clock().uninstall();

                done();
            });

            it("option silentTimeout is taken into account", function () {

                evs.silentTimeout = 1000;
                evs._xhr.sendData('data: "First line of data."\ndata: "Second line of data."\n\r\ndata: "First part of broken message.');
                evs._xhr.sendData('Second part of broken message."\n\r\nid: 1983\rdata: "Message with new id"\n\n');

                setTimeout(function() {
                }, 1100);
                jasmine.clock().tick(1101);

                evs._xhr.sendData('data: "Message to force dispatching the open event"\n\n');
                var expectedOpenEvents = ["open", "open"];
                var expectedErrorEvents = ["error"];

                expect(recievedOpenEvents).toEqual(expectedOpenEvents);
                expect(recievedErrorEvents).toEqual(expectedErrorEvents);
            });
        });
    });
});

describe("Evaluating EventSource 'time to attach listener' doubt", function() {

    var evs, previousXHR,
        recievedMessageEvents = [],
        recievedOpenEvents = [],
        recievedErrorEvents = [];

    beforeEach(function (done) {

        var mockupXHR = function (evs) {

            this.responseText = '';
            this.evs = evs;
            evs._xhr = this;

            // send data right away to stress the events
            this.sendData(this.initialData || '');
        };

        mockupXHR.prototype = {

            initialData: 'data: "I will fire very quick"\n\n',

            useXDomaineRequest: false,

            _request: null,

            _failed: false,

            isReady: function () {

                return true;
            },

            isDone: function () {

                return false;
            },

            hasError: function () {

                return (this._failed);
            },

            getBuffer: function () {

                return this.responseText;
            },

            abort: function () {

            },

            sendData: function (str) {

                evs = this.evs;
                this.responseText += str;
                evs.ondata();
            }
        };

        this.eventSource = window[evsImportName];
        previousXHR = this.eventSource.prototype.XHR;
        this.eventSource.prototype.XHR = mockupXHR;

        evs = new this.eventSource('http://exampleTimeToAttachDoubt.com');

        evs.addEventListener('message', function(e) {
            recievedMessageEvents.push(e.data);
        }, false);
        evs.addEventListener('open', function(e) {
            recievedOpenEvents.push(e.type);
        }, false);
        evs.addEventListener('error', function(e) {
            recievedErrorEvents.push(e.data);
        }, false);
        setTimeout(function () {
            done();
        }, 0);
    });

    afterEach(function (done) {
        evs.close();
        this.eventSource.prototype.XHR = previousXHR;
        done();
    });

    it("should catch initial message sent", function (done) {

        var expectedMessageEvents = ['"I will fire very quick"'];
        expect(recievedMessageEvents).toEqual(expectedMessageEvents);
        done();
    })
});

describe('Failed XHR request(invalid url) shall trigger EventSource to close and "error" event to be dispatched', function() {

    var evs,
        recievedMessageEvents = [],
        recievedOpenEvents = [],
        recievedErrorEvents = [];

    beforeEach(function (done) {

        this.eventSource = window[evsImportName];

        // sending to wrong url
        evs = new this.eventSource('http://exampleFailedXHRequest');

        evs.addEventListener('message', function (e) {
            recievedMessageEvents.push(e.data);
        }, false);
        evs.addEventListener('open', function (e) {
            recievedOpenEvents.push(e.type);
        }, false);
        evs.addEventListener('error', function (e) {
            recievedErrorEvents.push(e.type);
            done();
        }, false);
    });

    afterEach(function (done) {

        evs.close();
        recievedErrorEvents = [];
        done();
    });

    it("should send error event", function (done) {

        expect(recievedErrorEvents.length).toBe(1);
        done();
    });
});

describe('Failed XHR request(missing-code 404) shall trigger EventSource to close and "error" event to be dispatched', function() {

    var evs,
        recievedMessageEvents = [],
        recievedOpenEvents = [],
        recievedErrorEvents = [];

    beforeEach(function (done) {

        this.eventSource = window[evsImportName];

        // sending to wrong url
        evs = new this.eventSource('/missing');

        evs.addEventListener('message', function (e) {
            recievedMessageEvents.push(e.data);
        }, false);
        evs.addEventListener('open', function (e) {
            recievedOpenEvents.push(e.type);
        }, false);
        evs.addEventListener('error', function (e) {
            recievedErrorEvents.push(e.type);
            done();
        }, false);
    });

    afterEach(function () {

        evs.close()
    });

    it("should send error event", function (done) {

        expect(recievedErrorEvents.length).toBe(1);
        done();
    });
});

describe('Tests with twisted server:', function() {


    var evs,
        receivedMessageEvents = [],
        receivedOpenEvents = [],
        receivedErrorEvents = [],
        receivedTestMetaEvents = [],
        receivedTestEndEvents = [];

    function addEventListeners(evs, done) {

        evs.addEventListener('message', function (e) {
//            if (e.lastEventId) {console.log(e.lastEventId);}
//            console.log('message: ' + e.type + ":" + e.data)
//            console.log(e)
            if (e.data) {receivedMessageEvents.push(e.data);}
        }, false);
        evs.addEventListener('open', function (e) {
            receivedOpenEvents.push(e.type);
        }, false);
        evs.addEventListener('error', function (e) {
            receivedErrorEvents.push(e.type);
        }, false);
        evs.addEventListener('testmeta', function (e) {
//            console.log("received testmeta:" + e.type + "["+ evs.id +"]: "+ e.data);
//            console.log(e)
            receivedTestMetaEvents = JSON.parse(e.data);
        }, false);
        evs.addEventListener('testend', function (e) {
            receivedTestEndEvents.push(e.type);
//            console.log('received tesend' + e.type + ":" + e.data + "end");
//            console.log(e)
            done();
        }, false);
    }

    afterEach(function (done) {

        evs.close();
        receivedErrorEvents = [];
        receivedMessageEvents = [];
        receivedTestEndEvents = [];
        receivedTestMetaEvents = [];
        receivedOpenEvents = [];
        done();
    });

    describe('4-messages-with-seed-01', function() {

        var twistedUrl = '/test/eventsource/4-messages-with-seed-01';

        describe('using polyfill eventsource', function () {

            beforeEach(function (done) {

                var eventSource = window[evsImportName];

                evs = new eventSource(twistedUrl);
                addEventListeners(evs, done);
            });

            describe ('after a complete run until testend:', function() {

                it("data in testmeta event should match all incoming messages data", function () {

                    expect(receivedTestMetaEvents).toEqual(receivedMessageEvents);
                });

                it("testend event is received", function () {

                    expect(receivedTestEndEvents.length).toEqual(1);
                })
            });
        });

        if (isEventSourceSupported) {

            describe('using native eventsource', function () {

                beforeEach(function (done) {

                    var eventSource = window[evsName];

                    evs = new eventSource(twistedUrl);
                    addEventListeners(evs, done);
                });

                describe ('after a complete run until testend:', function() {

                    it("data in testmeta event should match all incoming messages data", function () {

                        expect(receivedTestMetaEvents).toEqual(receivedMessageEvents);
                    });

                    it("testend event is received", function () {

                        expect(receivedTestEndEvents.length).toEqual(1);
                    })
                });
            })
        }
    });

    describe('6-messages-with-seed-02', function() {

        var twistedUrl = '/test/eventsource/6-messages-with-seed-02';

        describe('using polyfill eventsource', function () {

            beforeEach(function (done) {

                var eventSource = window[evsImportName];

                evs = new eventSource(twistedUrl);
                addEventListeners(evs, done);
            });

            describe ('after a complete run until testend:', function() {

                it("data in testmeta event should match all incoming messages data", function () {

                    expect(receivedTestMetaEvents).toEqual(receivedMessageEvents);
                });

                it("testend event is received", function () {

                    expect(receivedTestEndEvents.length).toEqual(1);
                })
            });
        });

        if (isEventSourceSupported) {

            describe('using native eventsource', function () {

                beforeEach(function (done) {

                    var eventSource = window[evsName];

                    evs = new eventSource(twistedUrl);
                    addEventListeners(evs, done);
                });

                describe ('after a complete run until testend:', function() {

                    it("data in testmeta event should match all incoming messages data", function () {

                        expect(receivedTestMetaEvents).toEqual(receivedMessageEvents);
                    });

                    it("testend event is received", function () {

                        expect(receivedTestEndEvents.length).toEqual(1);
                    })
                });
            })
        }
    });

    describe('8-messages-closeat-4-with-seed-03', function() {

        var twistedUrl = '/test/eventsource/8-messages-closeat-4-with-seed-03';

        describe('using polyfill eventsource', function () {

            beforeEach(function (done) {

                var eventSource = window[evsImportName];

                evs = new eventSource(twistedUrl);
                addEventListeners(evs, done);
            });

            describe ('after a complete run until testend:', function() {

                it("data in testmeta event should match all incoming messages data", function () {

                    expect(receivedTestMetaEvents).toEqual(receivedMessageEvents);
                });

                it("testend event is received", function () {

                    expect(receivedTestEndEvents.length).toBe(1);
                });

                it("at least 1 error message are received, meaning 1 reconnection", function () {

                    expect(receivedErrorEvents.length).toBeGreaterThan(0); // we expect at least 1
                });
            });
        });

        if (isEventSourceSupported) {

            describe('using native eventsource', function () {

                beforeEach(function (done) {

                    var eventSource = window[evsName];

                    evs = new eventSource(twistedUrl);
                    addEventListeners(evs, done);
                });

                describe ('after a complete run until testend:', function() {

                    it("data in testmeta event should match all incoming messages data", function () {

                        expect(receivedTestMetaEvents).toEqual(receivedMessageEvents);
                    });

                    it("testend event is received", function () {

                        expect(receivedTestEndEvents.length).toBe(1);
                    });

                    it("at least 1 error messages are received, meaning 1 reconnection", function () {

                        expect(receivedErrorEvents.length).toBeGreaterThan(0);
                    });
                });
            })
        }
    });

    describe('16-messages-closeat-5-with-seed-04', function() {

        var twistedUrl = '/test/eventsource/16-messages-closeat-5-with-seed-04';

        describe('using polyfill eventsource', function () {

            beforeEach(function (done) {

                var eventSource = window[evsImportName];

                evs = new eventSource(twistedUrl);
                addEventListeners(evs, done);
            });

            describe ('after a complete run until testend:', function() {

                it("data in testmeta event should match all incoming messages data", function () {

                    expect(receivedTestMetaEvents).toEqual(receivedMessageEvents);
                });

                it("testend event is received", function () {

                    expect(receivedTestEndEvents.length).toBe(1);
                });

                it("3 error messages are received, meaning 3 reconnections", function () {

                    expect(receivedErrorEvents.length).toBeGreaterThan(1); // we expect at least 3
                });
            });
        });

        if (isEventSourceSupported) {

            describe('using native eventsource', function () {

                beforeEach(function (done) {

                    var eventSource = window[evsName];

                    evs = new eventSource(twistedUrl);
                    addEventListeners(evs, done);
                });

                describe ('after a complete run until testend:', function() {

                    it("data in testmeta event should match all incoming messages data", function () {

                        expect(receivedTestMetaEvents).toEqual(receivedMessageEvents);
                    });

                    it("testend event is received", function () {

                        expect(receivedTestEndEvents.length).toBe(1);
                    });

                    it("3 error messages are received, meaning 3 reconnections", function () {

                        expect(receivedErrorEvents.length).toBeGreaterThan(1);
                    });
                });
            })
        }
    });
});

