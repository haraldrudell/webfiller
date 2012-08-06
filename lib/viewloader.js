// viewloader.js
// server side: load views from filesystem and compile into render function

var compiler = require('./compiler')
// http://nodejs.org/docs/latest/api/fs.html
var fs = require('fs')
// http://nodejs.org/api/path.html
var path = require('path')

module.exports = {
	loadView: loadView,
	loadCached: loadCached,
	 setParameters:  setParameters,
	 getCacheKey: getCacheKey,
}

var fragmentDirectory = {}
exports.fragmentDirectory = fragmentDirectory
var cache = {}
var viewFolder = ''
var viewExtension = ''
var cacheFlag = false

// load a view from the filesystem
// file: absolute path
// bindings: bindings to use when compiling into render function
// cb: callback(err, renderFunction)
// cacheFlag: optional boolean: if true save to and read from a server side cache
function loadView(file, bindings, cb, cacheFlag) {

	// get from cache
	var cacheKey = getCacheKey(file, bindings)
	var renderFunction
	if (cacheFlag) {
		renderFunction = cache[cacheKey]
		if (renderFunction) cb(null, renderFunction)
	}
	if (!renderFunction) {

		// get from file and save to cache
		fs.readFile(file, 'utf-8', function (err, html) {
			if (!err) {
				renderFunction = compiler.compileHtml5(html, bindings)
				if (cacheFlag) cache[cacheKey] = renderFunction
			}
			cb(err, renderFunction)
		})
	}
}

function getCacheKey(file, bindings) {
	var cacheKey = file + JSON.stringify(bindings)
	return cacheKey
}

// load an included view at render time on server
// view: string view name like 'index/fragment'
// bindings: bindings to use for compile
// return value: render function
function loadCached(view, bindings) {
	var view = path.join(viewFolder, view + viewExtension)
	var renderFunction
	var cacheKey
	if (cacheFlag) {
		var cacheKey = getCacheKey(view, bindings)
		renderFunction = cache[cacheKey]
	}
	if (!renderFunction) {
		var html = fs.readFileSync(view, 'utf-8')
	 	renderFunction = compiler.compileHtml5(html, bindings)
	 	if (renderFunction && cacheKey) cache[cacheKey] = renderFunction
	 }
	return renderFunction
}

// set parameters for include rendering on server
// path: absolute path to view folder
// ext: default view extension 'html'
// globalCacheFlag: optional boolean, default false
function setParameters(path, ext, globalCacheFlag) {
	if (path) viewFolder = path
	if (ext != null) viewExtension = ext ? '.' + ext : ext
	cacheFlag = !!globalCacheFlag
}