
describe('Test concurrent operation of various EventSource against real stream', function(){

    var polyfillEventSource = window['TestEventSource'];

    var nativeEventSource = window['EventSource'];

    var TEST_SOURCE_URLS = [
	"/test/eventsource/4-messages-with-seed-01",
	"/test/eventsource/6-messages-with-seed-02",
	"/test/eventsource/8-messages-closeat-4-with-seed-03",
	"/test/eventsource/16-messages-closeat-5-with-seed-04",
    ];


    jasmine.DEFAULT_TIMEOUT_INTERVAL = 300000;
    
    var WM = function (EventSourceFactory, EventSourceName, sourceUrls){
	
	var self = {};
	
	var _count = sourceUrls.length;
	
	self.setdonecb = function(donefunc){

	    if (_count <= 0 && donefunc ){
		donefunc();
	    }
	    self.donecallback = donefunc;
	};

	self.complete = function(){

	    --_count;
	    if (_count <= 0 && self.donecallback){
		self.donecallback();
	    }
	};

	function EVS(srcUrl){

	    var evs = new EventSourceFactory(srcUrl);
	    var ctx = this;

	    ctx.eventsource = evs;

	    ctx.msgEvents = [];
	    evs.addEventListener('message', function (e) {
		if (e.data) {ctx.msgEvents.push(e.data);}
	    }, false);

	    ctx.openEvents = [];
	    evs.addEventListener('open', function (e) {
		ctx.openEvents.push(e.type);
	    }, false);

	    ctx.errorEvents = [];
	    evs.addEventListener('error', function (e) {
		ctx.errorEvents.push(e.type);
	    }, false);

	    ctx.testmetaEvents = [];
	    evs.addEventListener('testmeta', function (e) {
		ctx.testmetaEvents = JSON.parse(e.data);
	    }, false);

	    ctx.testendEvents = [];
	    evs.addEventListener('testend', function (e) {
		ctx.testendEvents.push(e.type);
		self.complete();
		evs.close();
	    }, false);
	};
	
	// create one EventSource for each url in sourceUrls
	self.sources = [];
	for (var i=0; i < sourceUrls.length; i++){

	    console.log("creating new "+EventSourceName+" on "+sourceUrls[i]);
	    self.sources.push(new EVS(sourceUrls[i]));
	}

	return self;
    };


    describe("consume 4 sources concurrently", function(){

        describe('using polyfill eventsource', function () {

	    var wm = WM(polyfillEventSource,"polyfill EventSource", TEST_SOURCE_URLS);

            beforeEach(function (done) {

		this.sources = wm.sources;
		wm.setdonecb(done);
            });
	    
	    afterEach(function (done){

		console.log("polyfill EventSource SPEC OVER...");
		done();
	    });


	    it("sources.length shall be equal to TEST_SOURCE_URLS.length", function (){

		expect(this.sources.length).toEqual(TEST_SOURCE_URLS.length);
	    });

	    it("data in testmeta event should match all incoming messages data", function () {

		var result;
		for (var i=0; i < this.sources.length; i++){

		    result = this.sources[i];
		    expect(result.testmetaEvents).toEqual(result.msgEvents);
		};
	    });

	    it("testend event was received", function () {

		var result;
		for (var i=0; i < this.sources.length; i++){

		    result = this.sources[i];
		    expect(result.testendEvents.length).toEqual(1);
		};
	    });
        });

	if (nativeEventSource){

	    describe('using native eventsource', function () {

		var wm = WM(nativeEventSource,"native EventSource", TEST_SOURCE_URLS);

		beforeEach(function (done) {
		    this.sources = wm.sources;
		    wm.setdonecb(done);
		});

		afterEach(function (done){

		    console.log("native EventSource SPEC OVER...");
		    done();
		});

		it("sources.length shall be equal to TEST_SOURCE_URLS.length", function (){

		    expect(this.sources.length).toEqual(TEST_SOURCE_URLS.length);
		});

		it("data in testmeta event should match all incoming messages data", function () {

		    var result;
		    for (var i=0; i < this.sources.length; i++){

			result = this.sources[i];
			expect(result.testmetaEvents).toEqual(result.msgEvents);
		    };
		});

		it("testend event was received", function () {

		    var result;
		    for (var i=0; i < this.sources.length; i++){

			result = this.sources[i];
			expect(result.testendEvents.length).toEqual(1);
		    };
		});
	    });
	};
    });
});
