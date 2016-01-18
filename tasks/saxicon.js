/*global escape:true*/
/*
 * grunt-saxicon
 * Copyright (c) 2016 Lachlan McDonald
 * Licensed under the BSD 3-Clause license.
 */
var path = require('path'),
	xml2js = require('xml2js'),
	_ = require('lodash');

module.exports = function(grunt) {
	'use strict';

	var parseSVG = (function() {
		var prefix = 'data:image/svg+xml,',
			colorKey = '__saxicon__',
			tags = ['path'],
			maxDepth = 50,
			traverse,
			parser,
			builder;

		parser = new xml2js.Parser({
			explicitArray: true
		});

		builder = new xml2js.Builder({
			explicitArray: true,
			headless: true,
			renderOpts: {
				pretty: false
			}
		});

		traverse = function() {

		};

		return function(filePath) {
			var content = grunt.file.read(filePath),
				parsed,
				viewBox,
				width,
				height;

			parser.parseString(content, function(error, xml) {
				xml = traverse(xml);
				viewBox = xml.svg[parser.options.attrkey].viewBox.split(' ');
				width = viewBox[2];
				height = viewBox[3];
				parsed = builder.buildObject(xml).replace(/"/g, '\'');
			});

			parsed = (prefix + parsed.replace(/[^\ \-\.\d\w]/g, escape)).split(colorKey);

			return {
				width: width,
				height: height,
				svg: parsed
			};
		};
	})();

	var globSVGFiles = function(dirPath, callback) {
		var temp = {};
		grunt.file.expand({
			cwd: dirPath
		}, '*.svg').forEach(function(fileName) {
			var iconName = callback(fileName);
			temp[iconName] = path.join(dirPath, fileName);
		});
		return temp;
	};

	grunt.registerMultiTask('saxicon', function() {
		var taskAsync = this.async(),
			svgFiles,
			options;

		options = this.options({
			iconName: function(fileName) {
				return fileName.replace(/^(.*)\.svg$/, '$1');
			},
			svgs: {
				fileName: function(fileName, iconName, colorName, color) {
        			return iconName + '.' + colorName + '.svg';
    			}
    		}
		});

		if (_.isFunction(options.iconName) === false) {
			grunt.fail.warn('"iconName" is not a function.');
		}
		if (_.isFunction(options.svgs.fileName) === false) {
			grunt.fail.warn('"fileName" is not a function.');
		}
		if (_.isString(options.source) === false) {
			grunt.fail.warn('"source" is a required and must be a string.');
		}

		svgFiles = globSVGFiles(options.source, options.iconName);

		if (svgFiles.length === 0) {
			grunt.fail.warn('"source" did not contain any SVG files.');
		}
	});
};
