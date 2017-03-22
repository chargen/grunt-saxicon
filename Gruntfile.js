/*
 * grunt-saxicon
 * Copyright (c) 2017 Deloitte Digital
 * Licensed under the BSD 3-Clause license.
 */

'use strict';

module.exports = function(grunt) {

	// Project configuration.
	grunt.initConfig({
		jshint: {
			all: [
				'Gruntfile.js',
				'tasks/*.js',
				'<%= nodeunit.tests %>'
			],
			options: {
				jshintrc: '.jshintrc'
			}
		},

		// Before generating any new files, remove any previously-created files.
		clean: {
			tests: ['tmp']
		},

		// Configuration to be run (and then tested).
		saxicon: {
			test_json: {
				options: {
					source: "test/src",
					json: "tmp/test_json/data.json",
				}
			},
			test_json2: {
				options: {
					source: "test/src",
					json: "tmp/test_json2/data.json",
					iconName: function(fileName) {
						return fileName.replace(/^(.*)\.svg$/, '$1-test');
					}
				}
			},
			test_ruby_scss: {
				options: {
					source: "test/src",
					scss: "tmp/test_ruby_scss/saxicon.scss"
				}
			},
			test_libsass_scss: {
				options: {
					source: "test/src",
					scss: "tmp/test_libsass_scss/saxicon.scss"
				}
			},
			test_svgs: {
				options: {
					source: "test/src",
					svgs: {
						target: "tmp/test_svgs/svgs/",
						colors: {
							red: "#F00",
							blue: "#00F",
							green: "#0F0"
						}
					}
				}
			},
			test_svgs2: {
				options: {
					source: "test/src",
					outputPath: function(filePath, iconName, colorName, color) {
						return iconName + '__' + colorName.toUpperCase() + '.svg';
					},
					svgs: {
						target: "tmp/test_svgs2/svgs/",
						colors: {
							red: "#F00",
							blue: "#00F"
						}
					}
				}
			},
			test_svgs3: {
				options: {
					source: "test/src",
					iconName: function(fileName) {
						return fileName.replace(/^icon-(.*)\.svg$/, '$1');
					},
					outputPath: function(filePath, iconName, colorName, color) {
						return colorName + '__' + iconName + '.svg';
					},
					svgs: {
						target: "tmp/test_svgs3/svgs/",
						colors: {
							red: "#F00",
							blue: "#00F"
						}
					}
				}
			},
			test_dimensions: {
				options: {
					source: "test/src/dimensions",
					json: "tmp/test_dimensions/data.json"
				}
			},
			test_no_dimensions: {
				options: {
					source: "test/src/no_dimensions",
					json: "tmp/test_no_dimensions/data.json",
					scss: "tmp/test_no_dimensions/saxicon.scss"
				}
			}
		},

		// Unit tests.
		nodeunit: {
			tests: ['test/*_test.js']
		}
	});

	// Actually load this plugin's task(s).
	grunt.loadTasks('tasks');

	// These plugins provide necessary tasks.
	grunt.loadNpmTasks('grunt-contrib-jshint');
	grunt.loadNpmTasks('grunt-contrib-clean');
	grunt.loadNpmTasks('grunt-contrib-nodeunit');

	// Whenever the "test" task is run, first clean the "tmp" dir, then run this
	// plugin's task(s), then test the result.
	grunt.registerTask('test', ['clean', 'nodeunit', 'clean']);

	// By default, lint and run all tests.
	grunt.registerTask('default', ['clean', 'jshint', 'test']);
};
