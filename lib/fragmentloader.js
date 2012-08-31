// fragmentloader.js
// provides compiler with means to load included fragments
// © Harald Rudell 2012

var compiler = require('./compiler')
// http://nodejs.org/docs/latest/api/fs.html
var fs = require('fs')
// http://nodejs.org/api/path.html
var path = require('path')

exports.getFragment = getFragment
exports.setParameters = setParameters

var viewStructure
var viewExtension = ''
var fragmentDirectory

/*
load a fragment from cache or disk server side
fragmentName: string: either 'fragmentName' or 'fragmentName.domain'
domain: optional string: suggested domain
cache: true if cached value should be used

return value: renderFunction function or string error message
*/
function getFragment(fragmentName, domain, cache) {
	var result

	var split = String(fragmentName).split('.')
	var fd = {f: split[0]}
	if (split.length > 1) { // specific name and domain
		fd.fd = split[0] + '.' + split[1]
		fd.d = split[1]
	} else {
		// exact fd is unknown
		if (typeof domain == 'string') fd.d = domain // suggested domain
	}
	// fd.f is set. fd.fd and fd.d may be set

	// try the cache
	if (fragmentDirectory && cache) {
		var cacheValue = fragmentDirectory.get(fd)
		if (typeof cacheValue == 'function') result = cacheValue
	}

	// try the disk
	if (!result) {
		result = readFragment(fd)
		if (typeof result == 'function' && fragmentDirectory && cache)
			fragmentDirectory.put(fd, result)
	}

	if (!result) result = 'Unknown fragment:' + (fd.fd || fd.f)

	return result
}

/*
read a fragment from disk
fd: f is initialized, fd and d may be initialized
*/
function readFragment(fd) {
	var result

	if (viewStructure) {

		// get bindings
		var bindings
		var viewData
		if (fd.d) { // if we have a domain, try it
			viewData = viewStructure[fd.d]
			if (viewData) bindings = scanModule(viewData.handler)
		}
		if (!bindings &&	// the domain did not work
			!fd.fd) { // if we did not have a specific domain, try any
			for (var view in viewStructure) { // scan all view structures
				viewData = viewStructure[view]
				if (bindings = scanModule(viewData.handler)) break
			}
		}

		// bindings object from handler JavaScript
		// viewData from viewscanner
		if (bindings) {

			// update fd with the match
			if (!fd.fd) fd.fd = fd.f + '.' + (fd.d = viewData.domain)

			// load fragment from disk
			var absolute = path.join(viewData.fragmentFolder, (bindings['-view'] || fd.f) + viewExtension)
			var html = fs.readFileSync(absolute, 'utf-8')
		 	result = compiler.compileHtml5(html, bindings, fd.d)
		}
	}

	return result

	function scanModule(module) {
		var bindings
		if (module) {
			if (module.publicFragments) bindings = module.publicFragments[fd.f]
			if (!bindings && module.fragments) bindings = module.fragments[fd.f]
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
function setParameters(aVviewStructure, ext, fragmentDir) {
	viewStructure = aVviewStructure
	viewExtension = '.' + ext
	fragmentDirectory = fragmentDir
}