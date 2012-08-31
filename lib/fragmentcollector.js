// fragmentcollector.js
// assembles fragment as JavaScript source text for frontend
// © Harald Rudell 2012

var fragmentloader = require('./fragmentloader')

exports.collect = collect

/*
collect the JavaScript source code for all frontend fragments

return value: string JavaScript code
throws Error on issue
*/
function collect(viewStructure, ext) {

	// compile all explicitly exported fragments
	var fragList = []
	var fragMap = {}
	var fragToDomainMap = {}
	for (var view in viewStructure) {
		var viewData = viewStructure[view]
		if (viewData.handler) {
			var domain = viewData.domain
			for (var fragmentName in viewData.handler.publicFragments)
				resolveFragment()
		}
	}

	// compile all included fragments that are not already compiled
	var renderFunction
	while (renderFunction = fragList.shift()) {
		var domain = renderFunction.getDomain()
		renderFunction.getIncludes().forEach(function (fragmentName) {
			resolveFragment()
		})
	}

	// assemble the JavaScript of all required renderFuntions
	var js = []
	for (var key in fragMap) {
		js.push(fragMap[key].getSource(key))
	}
	// add the map from fragment to fragment.domain
	js.push('\nWF.directory=')
	js.push(JSON.stringify(fragToDomainMap))
	return js.join('')

	function resolveFragment() {
		var renderFunction = fragmentloader.getFragment(fragmentName, domain)
		if (typeof renderFunction == 'string') throw Error('Unknown fragment:\'' + fragmentName + '\' ' + renderFunction)
		var fd = {
			f: String(fragmentName).split('.')[0],
			d: renderFunction.getDomain(),
		}
		if (typeof fd.d != 'string' || !fd.d) throw Error('Fragment missing domain:\'' + fragmentName + '\'')
		fd.fd = fd.f + '.' + fd.d
		if (!fragMap[fd.fd]) {
			fragMap[fd.fd] = renderFunction
			fragList.push(renderFunction)
			var domainArray = fragToDomainMap[fd.f]
			if (!domainArray) fragToDomainMap[fd.f] = [fd.d]
			else domainArray.push(fd.d)
		}
	}
}