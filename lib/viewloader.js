// viewloader.js
// server side: load and cache render functions for main views
// © Harald Rudell 2012

var compiler = require('./compiler')
// http://nodejs.org/docs/latest/api/fs.html
var fs = require('fs')

exports.getMainView = getMainView

var viewCache = {}

/*
load a main view render function from cache or filesystem
opts: object
.file: absolute path
.bindings: bindings to use when compiling into render function
.cacheFlag: optional boolean: if true save to and read from a server side cache
.domain: name of the fragment domain
cb: callback(err, renderFunction)
*/
function getMainView(opts, cb) {
	// get from cache
	var cacheKey
	var renderFunction
	if (opts.cacheFlag) {
		cacheKey = getCacheKey(opts.file, opts.bindings)
		renderFunction = viewCache[cacheKey]
		if (renderFunction) cb(null, renderFunction)
	}
	if (!renderFunction) {

		// get from file and possibly save to cache
		fs.readFile(opts.file, 'utf-8', function (err, html) {
			if (!err) {
				renderFunction = compiler.compileHtml5(html, opts.bindings, opts.domain)
				if (opts.cacheFlag) viewCache[cacheKey] = renderFunction
			}
			cb(err, renderFunction)
		})
	}
}

// cache key for main view cache
function getCacheKey(file, bindings) {
	var cacheKey = file + JSON.stringify(bindings)
	return cacheKey
}