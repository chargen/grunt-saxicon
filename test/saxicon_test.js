'use strict';

var grunt = require('grunt'),
	exec = require('child_process').exec,
	path = require('path');

var execOptions;

execOptions = {
	cwd: path.join(__dirname, '..')
};

exports.saxicon = {
	// Get list of test SVGs
	setUp: function(done) {
		this.svgs = grunt.file.expand({
			cwd: 'test/src'
		}, '*.svg').map(function(x) {
			return [path.basename(x, '.svg'), '.svg'];
		});

		done();
	},

	// Ruby SASS can compile when functions are used
	test_scss_ruby: function(test) {
		var outputPath = grunt.config('saxicon.test_scss_ruby.options.scss');
		test.expect(1);

		exec('grunt saxicon:test_scss_ruby', execOptions, function(error, stdout) {
			var dest = path.join(path.dirname(outputPath), 'test.scss');
			grunt.file.write(dest, '@import "saxicon";\n@include sax-classes(blue);');

			exec('sass ' + dest + ' --no-cache', execOptions, function(error, stdout) {
				test.strictEqual(error, null);
				test.done();
			});
		});
	},

	// libSass (sassc) can compile when functions are used
	test_scss_libsass: function(test) {
		var outputPath = grunt.config('saxicon.test_scss_libsass.options.scss');
		test.expect(1);

		exec('grunt saxicon:test_scss_libsass', execOptions, function(error, stdout) {
			var dest = path.join(path.dirname(outputPath), 'test.scss');
			grunt.file.write(dest, '@import "saxicon";\n@include sax-classes(blue);');

			exec('sassc ' + dest, execOptions, function(error, stdout) {
				test.strictEqual(error, null);
				test.done();
			});
		});
	},

	// Test that there is a file for each icon + color combination, based on the
	// colors specified in the test_svgs task
	test_svgs: function(test) {
		var colors = Object.keys(grunt.config('saxicon.test_svgs.options.svgs.colors')),
			outputPath = grunt.config('saxicon.test_svgs.options.svgs.target'),
			output;

		test.expect(1 + (this.svgs.length * colors.length));

		exec('grunt saxicon:test_svgs', execOptions, function(error, stdout) {
			var svgs = grunt.file.expand({
				cwd: outputPath
			}, '*.svg');

			test.ok(svgs.length === this.svgs.length * colors.length);

			colors.forEach(function(color) {
				this.svgs.forEach(function(a) {
					var fname = a[0] + '.' + color + a[1];
					test.notEqual(svgs.indexOf(fname), -1);
				});
			}.bind(this));

			test.done();
		}.bind(this));
	},

	// Test that there is a file for each icon + color combination, based on the
	// colors specified in the test_svgs task and taking into account a custom
	// outputPath callback.
	test_svgs2: function(test) {
		var colors = Object.keys(grunt.config('saxicon.test_svgs2.options.svgs.colors')),
			outputPath = grunt.config('saxicon.test_svgs2.options.svgs.target'),
			output;

		test.expect(1 + (this.svgs.length * colors.length));

		exec('grunt saxicon:test_svgs2', execOptions, function(error, stdout) {
			var svgs = grunt.file.expand({
				cwd: outputPath
			}, '*.svg');

			test.ok(svgs.length === this.svgs.length * colors.length);

			colors.forEach(function(color) {
				this.svgs.forEach(function(a) {
					var fname = a[0] + '__' + color.toUpperCase() + a[1];
					test.notEqual(svgs.indexOf(fname), -1);
				});
			}.bind(this));

			test.done();
		}.bind(this));
	},

	// Test that there is a file for each icon + color combination, based on the
	// colors specified in the test_svgs task and taking into account custom
	// iconName and outputPath callbacks.
	test_svgs3: function(test) {
		var colors = Object.keys(grunt.config('saxicon.test_svgs3.options.svgs.colors')),
			outputPath = grunt.config('saxicon.test_svgs3.options.svgs.target'),
			fn = grunt.config('saxicon.test_svgs3.options.iconName'),
			output;

		test.expect(1 + (this.svgs.length * colors.length));

		exec('grunt saxicon:test_svgs3', execOptions, function(error, stdout) {
			var svgs = grunt.file.expand({
				cwd: 'tmp/test_svgs3/svgs'
			}, '*.svg');

			test.ok(svgs.length === this.svgs.length * colors.length);

			colors.forEach(function(color) {
				this.svgs.forEach(function(a) {
					var fname = color + '__' + fn(a[0] + a[1]) + a[1];
					test.notEqual(svgs.indexOf(fname), -1);
				});
			}.bind(this));

			test.done();
		}.bind(this));
	},

	// Test that JSON output is parseable and has the expected keys
	test_json: function(test) {
		var outputPath = grunt.config('saxicon.test_json.options.json'),
			keys;

		// Each item in the JSON output should contain these keys
		// and type.
		keys = {
			width: 'number',
			height: 'number',
			components: 'object',
			path: 'string',
			icon: 'string'
		};

		test.expect(2 + (Object.keys(keys).length + 1) * this.svgs.length);

		exec('grunt saxicon:test_json', execOptions, function(error, stdout) {
			var data;

			// Test that JSON output is parseable
			test.doesNotThrow(function() {
				data = grunt.file.readJSON(outputPath);
			});

			// Test that the JSON contains as many items as there are
			// there are source icons
			test.equal(data.length, this.svgs.length);

			data.forEach(function(icon) {
				for (var k in keys) {
					if (keys.hasOwnProperty(k)) {
						test.equal(typeof icon[k], keys[k]);
					}
				}
				test.ok(icon.components.length > 0);
			}.bind(this));

			test.done();
		}.bind(this));
	},

	// Test that icon names in the JSON output is properly using the the iconName
	// callback in the task config
	test_json2: function(test) {
		var outputPath = grunt.config('saxicon.test_json2.options.json'),
			fn = grunt.config('saxicon.test_json2.options.iconName');
		test.expect(1);

		exec('grunt saxicon:test_json2', execOptions, function(error, stdout) {
			var data = grunt.file.readJSON(outputPath),
				iconNames,
				svgs;

			svgs = this.svgs.map(function(svg) {
				return fn(svg.join(''));
			}).sort();
			iconNames = data.map(function(x) {
				return x.icon;
			}).sort();

			test.deepEqual(svgs, iconNames);
			test.done();
		}.bind(this));
	},

	// Test that icons with width\height attributes, a viewBox, or both will have
	// the width\height data available in JSON output.
	test_dimensions: function(test) {
		var outputPath = grunt.config('saxicon.test_dimensions.options.json');

		exec('grunt saxicon:test_dimensions', execOptions, function(error, stdout) {
			var data;

			test.doesNotThrow(function() {
				data = grunt.file.readJSON(outputPath);
			});

			data.forEach(function(x) {
				test.equal(x.width, 40);
				test.equal(x.height, 40);
			});

			test.done();
		}.bind(this));
	},

	// Test that icons missing a width\height attributes, or viewBox, will have
	// width\height properties as null in JSON output.
	test_no_dimensions: function(test) {
		var outputPath = grunt.config('saxicon.test_no_dimensions.options.json');

		exec('grunt saxicon:test_no_dimensions', execOptions, function(error, stdout) {
			var data;

			test.doesNotThrow(function() {
				data = grunt.file.readJSON(outputPath);
			});

			data.forEach(function(x) {
				test.equal(x.width, null);
				test.equal(x.height, null);
			});

			test.done();
		}.bind(this));
	},

	// Test that auto-naming is converting hex colors into the SVG color keywords
	test_auto_color_naming: function(test) {
		var outputPath = grunt.config('saxicon.test_auto_color_naming.options.json');

		exec('grunt saxicon:test_auto_color_naming', execOptions, function(error, stdout) {
			var data;

			test.doesNotThrow(function() {
				data = grunt.file.readJSON(outputPath);
			});

			test.equal(data[0].components[1], "red");
			test.equal(data[0].components[3], "lime");

			test.equal(data[1].components[1], "lime");
			test.equal(data[1].components[3], "red");
			test.equal(data[1].components[5], "blue");

			test.equal(data[2].components[1], "lime");
			test.equal(data[2].components[3], "red");
			test.equal(data[2].components[5], "blue");

			test.equal(data[3].components[1], "lime");
			test.equal(data[3].components[3], "red");
			test.equal(data[3].components[5], "black");

			test.done();
		}.bind(this));
	},

	// Test gray
	test_gray: function(test) {
		var outputPath = grunt.config('saxicon.test_gray.options.json');

		exec('grunt saxicon:test_gray', execOptions, function(error, stdout) {
			var data;

			test.doesNotThrow(function() {
				data = grunt.file.readJSON(outputPath);
			});

			// These two are converted automatically
			test.equal(data[0].components[1], "darkgray");
			test.equal(data[0].components[5], "lightgray");

			// This color was defined as a keyword and shouldn't
			// be changed
			test.equal(data[0].components[3], "grey");

			test.done();
		}.bind(this));
	}
};
