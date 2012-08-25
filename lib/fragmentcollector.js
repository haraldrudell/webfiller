// fragmentcollector.js
// assembles fragment as JavaScript source text for frontend
// © Harald Rudell 2012

var viewloader = require('./viewloader')

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
	return js.join('')

	function resolveFragment() {
		var renderFunction = viewloader.getFragment(fragmentName, domain)
		if (typeof renderFunction == 'string') throw Error('Unknown fragment:\'' + fragmentName + '\' ' + renderFunction)
		var theDomain = renderFunction.getDomain()
		if (typeof domain != 'string' || !domain) throw Error('Fragment missing domain:\'' + fragmentName + '\'')
		var key = String(fragmentName).split('.')[0] + '.' + theDomain
		if (!fragMap[key]) {
			fragMap[key] = renderFunction
			fragList.push(renderFunction)
		}
	}
}