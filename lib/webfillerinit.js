// webfillerinit.js
// configures routes for express and writes resources to the public folder
// (c) Harald Rudell 2012

var viewscanner = require('./viewscanner')
var viewhandler = require('./viewhandler')
var fragmentloader = require('./fragmentloader')
var filewriter = require('./filewriter')
var fragmentcache = require('./fragmentcache')
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

	// scan the view structure
	scanOptions = {
		folder: opts.viewFolder,
		viewExt: opts.defExt,
		cssExt: 'css',
		handlerExt: 'js',
		frontEnd: '_1',
		dualSide: '_2.js',
		fragments: defaults.webfiller && defaults.webfiller.fragments || path.join(opts.viewFolder, 'fragments'),
	}

	var viewStructure = viewscanner.scan(scanOptions)

	// initialize loading of view and fragments
	fragmentloader.setParameters(viewStructure, opts.defExt, fragmentcache.getCache())

	// require dual-side JavaScript: adds custom functions server side
	for (var domain in viewStructure) {
		viewStructure[domain].js.forEach(function (absolute) {
			if (absolute.slice(-scanOptions.dualSide.length) == scanOptions.dualSide)
				try {
					require(absolute)
				} catch (e) {
					callback(Error('Require failed:' + absolute) + e.toString())
				}
		})
	}

	// make fragments and styling available to frontend
	var defView = defaults.webfiller && defaults.webfiller.defaultViewName
	if (defView !== false && !defView) defView = defaultViewName
	filewriter.write(opts.webFillerFolder, viewStructure, defView, opts.defExt, writeDone)

	function writeDone(err) {
		var result
		if (!err) {
			result = []
			for (var domain in viewStructure) {
				if (domain != '') {
					var viewData = viewStructure[domain]
					// if there is defaults.view[url], use that as settings for the view
					// otherwise viewconfigurations.index
					// otherwise nothing
					var viewConfiguration = defaults.view && defaults.view[domain] ||
						viewConfigurations[domain] || {}
					var getHandler = viewData.handler && viewData.handler.getHandler ||
						viewhandler.getHandler
					result.push({
						url: viewConfiguration.url != null ? viewConfiguration.url : domain,
						handler: getHandler(defaults, domain),
					})
				}
			}
		}
		callback(err, result)
	}
}