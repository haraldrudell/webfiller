// viewloader.js
// server side: load and cache render functions for main views and fragments

var compiler = require('./compiler')
// http://nodejs.org/docs/latest/api/fs.html
var fs = require('fs')
// http://nodejs.org/api/path.html
var path = require('path')

exports.loadView = loadView
exports.loadFragment = loadFragment
exports.setParameters = setParameters
exports.getFd = getFd

var fragmentCache = {}
var viewCache = {}
var viewStructure
var viewExtension = ''

/*
load a main view from the filesystem
opts: object
.file: absolute path
.bindings: bindings to use when compiling into render function
.cacheFlag: optional boolean: if true save to and read from a server side cache
.domain: name of the fragment domain
cb: callback(err, renderFunction)
*/
function loadView(opts, cb) {
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
				if (cacheFlag) viewCache[cacheKey] = renderFunction
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

/*
load a fragment from cache or disk server side
fragmentName: string name, may be 'fragment.domain'
domain: optional string: fragment domain
- fragment.domain overrides domain

return value: render function
*/
function loadFragment(fragmentName, domain, cache) {
	var result
	var fd = getFd(fragmentName, domain)

	if (cache) result = readFragmentCache(fd)
	if (!result) {
		var fObj = readFragment(fd)
		if (fObj && !(fObj instanceof Error)) {
			if (cache) writeFragmentCache(fObj)
			result = fObj.renderFunction
		}
	}

	return result
}

function writeFragmentCache(fObj) {
	var key = fObj.fragmentName + '.' + fObj.domain
	fragmentCache[key] = fObj.renderFunction
	var nameArray = fragmentCache[fObj.fragmentName]
	if (array.isArray(nameArray)) nameArray.push(key)
	else {
		fragmentCache[fObj.fragmentName] = [key]
	}
}

function getFd(fragmentName, domain) {
	var result = {}

	fragmentName = String(fragmentName)
	var split = fragmentName.split('.')
	if (split.length > 1) {
		result.domain = split[1]
		result.fragmentName = split[0]
	} else {
		result.domain = domain
		result.fragmentName = fragmentName
	}
	return result
}

function readFragmentCache(fd) {
	var result

	// find fragment cache key
	var key
	if (typeof fd.domain == 'string') key = fd.fragmentName + '.' + fd.domain
	else {
		var value = fragmentCache[fd.fragmentName]
		if (Array.isArray(value)) key = value[0]
	}

	// read cache
	if (key) {
		var value = fragmentCache[key]
		if (typeof value == 'function') result = value
	}

	return result
}

/*

*/
function readFragment(fd) {
	var result

	if (viewStructure) {

		// get fragment object
		var bindings
		var viewData
		if (typeof fd.domain == 'string') {
			viewData = viewStructure[fd.domain]
			if (viewData) bindings = scanModule(viewData.handler)
		} else for (var view in viewStructure) { // scan all view structures
			viewData = viewStructure[view]
			if (bindings = scanModule(viewData.handler)) break
		}

		// bindings object from handler JavaScript
		// viewData from viewscanner
		if (bindings) {

			// load fragment from disk
			var absolute = path.join(viewData.fragmentFolder, (fragment['-view'] || fd.fragmentName) + viewExtension)
			var html = fs.readFileSync(absolute, 'utf-8')
		 	var renderFunction = compiler.compileHtml5(html, bindings, fd.domain)
		 	result = renderFunction instanceof Error ? renderFunction :
		 	{
				fragmentName: fd.fragmentName,
				domain: viewData.domain,
				renderFunction: renderFunction,
		 	}
		}
	}

	return result

	function scanModule(module) {
		var bindings
		if (module) {
			if (module.publicFragments) bindings = module.publicFragments[fragmentName]
			if (!bindings && module.fragments) bindings = module.fragments[fragmentName]
		}
		return bindings		
	}
}

/*
set parameters for include rendering on server
path: absolute path to view folder
ext: default view extension 'html'
globalCacheFlag: optional boolean, default false
*/
function setParameters(aVviewStructure, ext) {
	viewStructure = aVviewStructure
	viewExtension = '.' + ext
}