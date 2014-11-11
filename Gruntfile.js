module.exports = function(grunt) {
    "use strict";
    grunt.initConfig({
	pkg: grunt.file.readJSON('package.json'),
	copy: {
	    main:{
		files: [{ src: ['javascript/src/eventsource.js'], dest: 'eventsource.js'}]
	    }
	},
	uglify: {
	    options: {
		preserveComments: "some",
		compress: {
		drop_console: true
	    }
	    },
	    build: {
		src: 'javascript/src/eventsource.js',
		dest: 'eventsource.min.js'
	    }
	}
	});
    grunt.loadNpmTasks('grunt-contrib-copy');
    grunt.loadNpmTasks('grunt-contrib-uglify');
    grunt.registerTask('default', ['copy','uglify']);
};
