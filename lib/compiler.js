// compiler.js
// compiles html and bindings json to a JavaScript render function
// (c) Harald Rudell 2012

var tagfinder = require('tagfinder')
var renderengine = require('./renderengine')
var runtime = require('./runtime')

module.exports = {
	compileHtml5: compileHtml5,
	renderInclude: renderInclude,
}

// produce a runtime render function with an enclosed viewExecutable
// html: string: plain html with no injected data
// bindings: object: key: class, id, or tag name, value: data source
// return value:
// if instanceof Error: compilation error
// otherwise viewExecutable object
function compileHtml5(html, bindings) {
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
		dataLinks: [],
	}

	// get description of all opening tags in the html
	// viewExecutable.pieces string array of html pieces
	// viewExecutable.tags object array of html opening tags
	var viewData = tagfinder.decomposeHtml(html)
	viewExecutable.pieces = viewData.contents

/*
	// add inserts
	for (var key in bindings) {
		if (key[0] == '-') {
			// '-view:shared': bindings
			if (key.substring(1, 6) != 'view:') throw Error('Unknown special instruction')
			var dataLink = {
				view: key.slice(6),
				bindings: bindings[key],
			}
			viewExecutable.dataLinks.push(dataLink)
		}
	}
*/
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
			/*
			case '-': // special instruction: prepend view
				// resolved by renderer
				viewExecutable.dataLinks.push({
					view: 
					bindings: bindings[key]
				})
				break
				*/
			case '#': // match tag id
				match = tagData.attributes.id == key.substring(1)
				break
			case '.': // match tag class
				match = tagData.classes.indexOf(key.substring(1)) != -1
				break
			default: // match tag
				match = key == tagData.tag
			}
			if (match) {

				// save each opening tag for which there was a matching binding
				var dataLink = {
					linkage: bindings[key],
					tag: useTagData,
				}
				viewExecutable.dataLinks.push(dataLink)
			}
		}
	})

	if (!result) {
		var renderEngine = renderengine.render

		// return value
		var result = render
		result.getSource = getSource
		result.getIncludes = getIncludes
		html = null
		viewData = null
		bindings = null
	}

	return result

	function render(record) {
		return renderEngine(record, viewExecutable)
	}

	// get the JavaScript source code for the render function
	// funcName: the name the funciton should have
	// return value: JavaScript function statement with  ending ';'
	function getSource(funcName) {
		var js = []
		js.push('WF.views["')
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
			if (dataLink.view) result.push(dataLink)
		})
		return result
	}
} // compile

/*
render an included view

 exposed to renderengine so it can recursively load views when on server
 return value: renderFunction
*/
function renderInclude(view, bindings) {
	// TODO fix this: server-browser, proper loading server side
	var viewloader = require('./viewloader')
	var renderFunction = viewloader.loadCached(
		view,
		bindings)
	if (!renderFunction) throw Error('Unknown included view:' + view)
	return renderFunction
}