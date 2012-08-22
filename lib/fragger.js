// fragger.js
// assembles fragment JavaScript for frontend
// © Harald Rudell 2012

var viewloader = require('./viewloader')

exports.frag = frag

function frag(viewStructure) {
	var js = []
	// key: fragment.domain, value: render function
	var keys = {}
	// render functions that have been processed
	var scanArray = []
	// non-public fragments: key: domain, value: object of bindings
	var moreFragments = {}

	// assemble all exported fragments
	for (var view in viewStructure) {
		var viewData = viewStructure[view]
		var bindings
		if (viewData.handler) {
			// load all public fragments (for frontend)
			if (bindings = viewData.handler.publicFragments) {
				for (var fragmentName in bindings)
					keyFragment(fragmentName, viewData.domain)
			}
			// save additional fragments
			if (bindings = viewData.handler.publicFragments) {
				moreFragments[viewData.domain] = bindings
			}
		}
	}

	// resolve missing fragments
	for (var index; index < scanArray.length; index++) {
		var func = scanArray[index]
		var domain = func.getDomain()
		var includes = func.getIncludes()

		// make sure all includes for this fragment are present
		includes.forEach(function (fragName) {
			var result
			var split = fragName.split('.')

			 // exact reference
			if (split.length == 2) result = findThis(split[0], split[1])
			else { // try domain first, then any
				result = findThis(fragName, domain)
				if (result === false) { // find any
					for (var mod in moreFragments) {
						if (result = findThis(fragName, domain) !== false) break
					}					
				}
			}

			if (!result) {
				// TODO not found
			}
		})
	}

	// assemble JavaScript
	for (var fragName in keys) {
		var rf = keys[fragName]
		js.push(rf.getSource(fragName))
	}

	return js.join('')

	function keyFragment(fragmentName, domain) {
		var func = viewloader.loadFragment(fragmentName, viewData.domain)
		if (!(func instanceof Error)) {
			var fd = viewloader.getFd(fragmentName, viewData.domain)
			var key = fd.fragmentName + '.' + fd.domain
			keys[key] = func
			scanArray.push(func)
		} else throw func// TODO error
	}

	// true: already loaded
	// string: load this
	// false: does not exist
	function findThis(frag, domain) {
		var result
		if (keys[fragName]) result = true
		else {
			// get the appropriate module
			var frags = moreFragments[domain]
			// find the bindings
			result = frags && frags[frag] ? frag + '.' + domain : false
			if (result) keyFragment(frag, domain)
		}

		return result
	}
}