module.exports = function(grunt) {

    "use strict";
    
    grunt.initConfig({

	pkg: grunt.file.readJSON('package.json'),

	'string-replace': {
	    dist: {
		options: {
		    replacements: [
			{pattern: /{{VERSION}}/g, replacement: '<%= pkg.version %>'}
		    ]
		},
		files: {
		    'dist/eventsource.js': ['javascript/src/eventsource.js']
		}
	    }
	},

	uglify: {
	    dist: {
		files: {
		    'dist/eventsource.min.js': ['dist/eventsource.js']
		}
	    }
	},

	
    });
    grunt.loadNpmTasks('grunt-string-replace');
    grunt.loadNpmTasks('grunt-contrib-uglify');
    grunt.registerTask('default', ['string-replace', 'uglify']);
};
