// renderer.js
// renders using a data record and a viewExecutable object
// © Harald Rudell 2012
// code may run in browser or on server

;(function (isNode, WF) {
	
	if (isNode) {
		// on node, text functions need to be explicitly imported
		// html5text.js adds functions to the WF object
		require('./html5text')
		// export the render function for compiler.js
		module.exports.render = render
	}
	// browser and Node: export render to the WF object
	WF.render = render

	/*
	render function: inserts data from record into html
	record: key-value json object

	included fragments:
	on server: provided by renderInclude
	in browser: provided by WF.fragments
	*/
	function render(record, viewExecutable, mainView) {
		record = Object(record)

		// in browser, resolve the view
		if (typeof viewExecutable == 'string') {
			var fragmentName = viewExecutable
			viewExecutable = WF.fragments[fragmentName]
			if (!viewExecutable) return 'Unknown fragment:' + fragmentName
		}

		// controlling final output
		var result = []
		var contentsIndex = 0
		var tagObject
		var clonedTag
		var suppressedContent
		var suppressedTag
		var prints

		// publics for custom functions
		var renderStep = {
			print: print,
			printRaw: printRaw,
			error: error,
			cloneTag: cloneTag,
			suppressContent: suppressContent,
			suppressTag: suppressTag,
			getField: getField,
		}

		// render the data links
		viewExecutable.dataLinks.forEach(function (dataLink) {

			// prepare for resolve invocation
			tagObject = dataLink.t || false
			renderStep.content = dataLink.t ? viewExecutable.pieces[dataLink.t.i + 1] : null
			clonedTag = false
			suppressedContent = false
			suppressedTag = false
			prints = []

			// print to prints buffer
			resolve.call(renderStep, dataLink.d)

			// output to result
			// certain actions forces us to actually do something
			if (clonedTag || suppressedContent || prints.length || suppressedTag) {

				// get the tag's index
				var flushToIndex = dataLink.t ? dataLink.t.i : 0

				// deal with a modified tag
				if (flushToIndex)
					if (clonedTag || suppressedTag) {
						// we need to output a customized tag

						// flush everything until the tag
						result.push.apply(result, viewExecutable.pieces.slice(contentsIndex, flushToIndex))
						
						// output customized tag
						if (!suppressedTag) result.push(printTag(tagObject))
						contentsIndex = flushToIndex + 1
					} else flushToIndex++

				// deal with supressed content
				if (suppressedContent || prints.length) {

					// flush everything until the content
					if (flushToIndex > contentsIndex) {
						result.push.apply(result, viewExecutable.pieces.slice(contentsIndex, flushToIndex))
						contentsIndex = flushToIndex
					}

					// output prints
					result.push.apply(result, prints)

					if (suppressedContent) contentsIndex++
				}
			}
		})

		// output final html
		result.push.apply(result, viewExecutable.pieces.slice(contentsIndex))

		return result.join('')

		function getField(name) {
			var result
			name = String(name)
			if (name.length) result = record[name]
			else result = clone(record)
			return result
		}

		function cloneTag() {
			if (!clonedTag) {
				clonedTag = true
				if (!tagObject) tagObject = {t:'', i:0, a:{}, c:[]}
				else tagObject = clone(tagObject)
			}
			return tagObject
		}

		function suppressContent() {
			suppressedContent = true
		}

		function suppressTag() {
			suppressedTag = true
		}

		function error(str) {
			if (typeof str != 'string') str = String(str)
			print(str)
		}

		function print(str) {
			printRaw(WF.functions.textToNormal(str))
		}

		function printRaw(str) {
			prints.push(str)
		}

		function printTag(t) {
			var result = []
			result.push('<')
			result.push(t.t)

			if (t.c.length) {
				result.push(' class=')
				result.push(WF.functions.textToDoubleQuotedAttributeValue(t.c.join(' ')))
			}
			for (var attribute in t.a) {
				result.push(' ')
				result.push(attribute)
				var value = t.a[attribute]
				if (value) {
					result.push('=')
					result.push(WF.functions.textToUnquotedAttributeValue(value))
				}
			}
			if (t.v) result.push('/')
			result.push('>')
			printRaw(result.join(''))
		}

	} // render

	// this reference contains data for the rendering
	// binding is the data source description
	function resolve(dataSource) {
		switch (typeof dataSource) {
		case 'string': // insert data ahead of tag contents
			this.print(this.getField(dataSource))
			break
		case 'object': // array or object
			if (Array.isArray(dataSource)) { // invoke each array element
				var self = this
				dataSource.forEach(function (value) {
					resolve.call(self, value)
				})
			} else { // keys are function names
				for (var funcName in dataSource) {
					var params = dataSource[funcName]

					// func is now 'append' or 'fragment'
					if (funcName == 'fragment') {

						// get renderFunction
						if (typeof params == 'string') {
							var renderFunction = WF.fragments[params]
							if (!renderFunction && isNode) {
								renderFunction = require('./compiler').loadFragment(params)
							}
							if (renderFunction instanceof Function) {

								// render the fragment
								data = renderFunction(this.getField(''))
								this.printRaw(data)
							} else this.error('Unknown view:' + includedView)
						} else  this.error('Fragment name not string')
					} else {
						var func = WF.functions[funcName]
						if (func instanceof Function) {
							func.call(this, params)
						} else this.error('Unknown rendering function:' + funcName)
					}
				}
			}
			break
		default:
			this.error('Unknown rendering data source type:' + typeof dataSource)
		}
	}

	// clone enumerable properties
	// primitives, array, and Object object honored
	function clone(o) {
		var result
		if (typeof(o) != 'object') result = o
		else {
			result = Array.isArray(o) ? [] : {}
			for (var p in o) {
				var v = o[p]
				result[p] = typeof v == 'object' ? clone(v) : v
			}
		}
		return result
	}
	
})(typeof module == 'object' && !!module.exports, // isNode
typeof module == 'object' && !!module.exports ? require('./runtime').WF : WF) // WF