// compiler.js
// compiles html and bindings json to a JavaScript render function
// © Harald Rudell 2012

var tagfinder = require('tagfinder')
var renderer = require('./renderer')

module.exports = {
	compileHtml5: compileHtml5,
	getFragment: getFragment,
}

/*
produce a runtime render function with an enclosed viewExecutable
html: string: plain html with no injected data
bindings: object: key: class, id, or tag name, value: data source

return value: render function
there is no error condition
*/
function compileHtml5(html, bindings, domain) {
	var result

	/*
	viewExecutable
	.pieces: array of string html
	.dataLinks: array of object
	key: data source:
	- linkage: bindings data source
	- tag: tagData object

	the viewExecutable can be serialized to json and subsequenctly deserialized in the browser
	*/
	var viewExecutable = {
		domain: domain,
		dataLinks: [],
	}

	// get description of all opening tags in the html
	// viewExecutable.pieces string array of html pieces
	// viewExecutable.tags object array of html opening tags
	var viewData = tagfinder.decomposeHtml(html)
	viewExecutable.pieces = viewData.pieces

	// allow us to find the beginning of a tagless document
	if (viewData.tags.length == 0) viewData.tags = [{a:{}, c:[], t:''}]

	// loop through all opening tags
	// collect any matching data binding
	// collect the tags that has a matching data binding
	viewData.tags.forEach(function (tagData, index) {

		// for each tag, loop through the available bindings
		for (var key in bindings) {
			var match
			var useTagData = tagData
			switch(key[0]) {
			case undefined: // empty string, it's location zero
				// only a match if the very first tag
				if (match = index == 0) useTagData = {}
				break
			case '#': // match tag id
				match = tagData.a.id == key.substring(1)
				break
			case '.': // match tag class
				match = tagData.c.indexOf(key.substring(1)) != -1
				break
			case '-': // special directive: ignore (for fragment: '-view': viewname)
				break
			default: // match tag
				match = key == tagData.t
			}
			if (match) {

				// save each opening tag for which there was a matching binding
				var dataLink = {
					d: bindings[key],
					t: useTagData,
				}
				viewExecutable.dataLinks.push(dataLink)
			}
		}
	})

	if (!result) { // result did not hold an error

		// successful return value
		var result = render
		result.getSource = getSource
		result.getIncludes = getIncludes
		result.getDomain = getDomain
		var theRenderer = renderer.render

		// save on memory
		html = null
		viewData = null
		bindings = null
	}

	return result

	function render(record) {
		return theRenderer(record, viewExecutable)
	}

	function getDomain() {
		return viewExecutable.domain
	}
	// get the JavaScript source code for the render function
	// funcName: the name the funciton should have
	// return value: JavaScript function statement with  ending ';'
	function getSource(funcName) {
		var js = []
		js.push('WF.fragments["')
		js.push(funcName)
		js.push('"]=')
		js.push(JSON.stringify(viewExecutable))
		js.push(';')
		return js.join('')
	}

	// get the views this viewExecutable includes
	// return value: array of object: .view .bindings
	function getIncludes() {
		var result = []
		viewExecutable.dataLinks.forEach(function (dataLink) {
			scanSource(dataLink.d)
			function scanSource(s) {
				if (Array.isArray(s)) s.forEach(function (key) {
					scanSource(key)
				})
				else if (typeof s == 'object') {
					if (s.fragment) result.push(s.fragment)
					for (var p in s) scanSource(s[p])
				}
			}
		})
		return result
	}
} // compile

/*
render a fragment (server side only)

 exposed to the renderer so it can recursively load views when on server
 return value: renderFunction(record)
 throws expcetion if fragment not found
*/
function getFragment(fragmentName, domain) {
	// delay this require to at runtime because the modules require each other
	return require('./fragmentloader').getFragment(fragmentName, domain)
}