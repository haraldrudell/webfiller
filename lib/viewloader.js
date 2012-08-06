// viewloader.js
// server side: load views from filesystem and compile into render function

var compiler = require('./compiler')
// http://nodejs.org/docs/latest/api/fs.html
var fs = require('fs')
// http://nodejs.org/api/path.html
var path = require('path')

module.exports = {
	loadView: loadView,
	loadFragment: loadFragment,
	 setParameters:  setParameters,
	 // key: fragmentName, value: object .file: absolute path, .bindings bindings object
	 addNewFragment: addNewFragment,
}

var fragmentDirectory = {}
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
function loadFragment(fragmentName) {
	var entry = fragmentDirectory[fragmentName]
	if (!entry) throw Error('Unknown fragment:' + fragmentName)

	var renderFunction
	if (cacheFlag) renderFunction = entry.function
	if (!renderFunction) {
		var html = fs.readFileSync(entry.file, 'utf-8')
	 	renderFunction = compiler.compileHtml5(html, entry.bindings)
	 	if (renderFunction && cacheFlag) {
	 		entry.function = renderFunction
	 		cache[getCacheKey(entry.file, entry.bindings)] = renderFunction
	 	}
	 }
	 if (!renderFunction) throw Error('Compilation failed for fragment:' + fragmentName)
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

function addNewFragment(fragmentName, path, bindings) {
	var result = !!fragmentDirectory[fragmentName]
	if (!result) {
		fragmentDirectory[fragmentName] = {
			file: path,
			bindings: bindings,
		}
	}
	return result
}