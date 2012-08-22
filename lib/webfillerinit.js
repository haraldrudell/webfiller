// webfillerinit.js
// configures routes for express and writes resources to the public folder
// (c) Harald Rudell 2012

var viewhandler = require('./viewhandler')
var viewscanner = require('./viewscanner')
var filewriter = require('./filewriter')
// http://nodejs.org/api/path.html
var path = require('path')
// http://nodejs.org/api/fs.html
var fs = require('fs')
if (!fs.existsSync) fs.existsSync = path.existsSync
if (!fs.exists) fs.exists = path.exists

module.exports = {
	initWebFiller: initWebFiller,
}

var defaultViewName = 'index'

// by default, the root url displays the view index
var viewConfigurations = {
	index: {
		url: ''
	}
}

var scanOptions
var viewStructure
/*
initialize webfiller
defaults: settings object
opts: options
.viewFolder: absolute path to the view folder a string typically ending with '../views'
.defExt: defaqult view extension eg. 'html'
.webFillerFolder: absolute path to where webfiller should write css and js
callback(err)
*/
function initWebFiller(defaults, opts, callback) {
	defaults = Object(defaults)
	opts = Object(opts)
	if (typeof opts.viewFolder != 'string') throw Error(arguments.callee.name + ' opts.viewFolder bad')
	if (typeof opts.defExt != 'string') throw Error(arguments.callee.name + ' opts.defExt bad')
	if (typeof opts.webFillerFolder != 'string') throw Error(arguments.callee.name + ' opts.webFillerFolder bad')

	scanOptions = {
		folder: opts.viewFolder,
		viewExt: opts.defExt,
		cssExt: 'css',
		handlerExt: 'js',
		frontEnd: '_1.js',
		dualSide: '_2.js',
		fragments: defaults.webfiller && defaults.webfiller.fragments || path.join(opts.viewFolder, 'fragments'),
	}
	var viewStructure = viewscanner.scan(scanOptions)
	viewloader.setParameters(viewStructure, opts.defExt)
	filewriter.write(opts.webFillerFolder, viewStructure, defaultViewName, writeDone)

	function writeDone() {
		throw Error('nimp')
	}
}