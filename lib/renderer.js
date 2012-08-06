// renderengine.js
// renders using a data record and a viewExecutable object
// (c) Harald Rudell 2012
// may run in browser or on server

// provide a local scope in the browser
;(function () {

	// in the browser, a global WF object has been declared by runtime.js

	// on the server, we need to get WF from runtime as amodule
	// export the render function
	var isNode = typeof module == 'object' && !!module.exports
	if (isNode) {

		// export the render function for the compiler
		module.exports.render = render
		// get the WF object from the runtime
		WF = require('./runtime').WF
		require('./html5text')
	} else {

		// in the browser, export render to the WF object
		WF.render = render
	}

	/*
	render function
	inserts data from record into the html
	record: key-value json object

	included views:
	on server: provided by renderInclude
	in browser: provided by WF.views
	*/
	function render(record, viewExecutable) {
		if (typeof viewExecutable == 'string') {
			var fragmentName = viewExecutable
			viewExecutable = WF.fragments[fragmentName]
			if (!viewExecutable) return 'Unknown fragment:' + fragmentName
		}

		var result = []
		var contentsIndex = 0
		var flushToIndex

		var renderStep = {
			print: print,
			printRaw: printRaw,
			error: error,
			getTagClone: getTagClone,
			printTag: printTag,
		}

		// render the data links
		viewExecutable.dataLinks.forEach(function (dataLink) {

			// normal dataLinks has .tag and .linkage
			// include dataLinks has .view and .bindings
			if (dataLink.view) {

				// get the render function
				var data
				if (isNode) {
					data = require('./compiler').renderInclude(dataLink)(record)
				} else {
					var aDataLink = WF.views[dataLink.view]
					if (!aDataLink) alert('Unknown view:' + dataLink.view)
					else  data = render(record, aDataLink)
				}
				if (data) result.push(data)
			} else {

				// prepare for resolve
				renderStep.tag = dataLink.tag ? viewExecutable.pieces[dataLink.tag.index] : null
				renderStep.content = dataLink.tag ? viewExecutable.pieces[dataLink.tag.index + 1] : null
				renderStep.tagData = dataLink.tag || null
				renderStep.record = record || {}
				flushToIndex = dataLink.tag ? dataLink.tag.index : 0

				resolve(renderStep, dataLink.linkage)

				// output final data
				if (contentsIndex != 0) { // not required for location 0
					if (contentsIndex == flushToIndex) {
						// print was called, up to and including tag is already done
						// ignore content if that is requested
						if (!renderStep.content) contentsIndex++
					} else {
						// print was not called: we might be able to just continue
						if (!renderStep.tag || !renderStep.content) {
							// tag or content is to be ignored, we must flush
							if (renderStep.tag) {
								flushToIndex++ // flush up to and including tag
								printRaw() // flush then ignore content
							} else {
								printRaw() // flush, then  ignore tag
							}
							contentsIndex++
						}
					}
				}
			}
		})

		// output final html
		result.push.apply(result, viewExecutable.pieces.slice(contentsIndex))

		return result.join('')

		function getTagClone() {
			var tagClone = clone(this.tagData)
			this.tag = null
			return tagClone
		}

		function printTag(t) {
			var result = []
			result.push('<')
			result.push(t.tag)

			if (t.classes) {
				result.push(' class=')
				result.push(WF.functions.textToDoubleQuotedAttributeValue(t.classes.join(' ')))
			}
			for (var attribute in t.attributes) {
				if (attribute != 'class') {
					result.push(' ')
					result.push(attribute)
					var value = t.attrbibutes[attribute]
					if (value) {
						result.push('=')
						result.push(WF.functions.textToUnquotedAttributeValue(value))
					}
				}
			}
			result.push('>')
			this.printRaw(result.join(''))
		}

		function error(str) {
			if (typeof str != 'string') str = String(str)
			this.print(str)
		}

		function print(str) {
			printRaw(WF.functions.textToNormal(str))
		}

		// if renderStep.tag is set, flush including this index
		// contentsIndex: the first index to print
		// flushToIndex: the first index not to print, typically an opening tag
		function printRaw(str) {
			if (flushToIndex > contentsIndex) {
				// this is the first printing for this tag. We need to flush first
				// print tag if it is not to be ignored
				if (renderStep.tag) flushToIndex++
				result.push.apply(result, viewExecutable.pieces.slice(contentsIndex, flushToIndex))
				// if tag is to be ignored, that happens here			
				if (!renderStep.tag) flushToIndex++
				contentsIndex = flushToIndex
			}
			if (str) result.push(str)
		}
	} // render

	// cx contains data for the rendering
	// binding is the data source description
	function resolve(cx, dataSource) {
		switch (typeof dataSource) {
		case 'string': // replace tag contents with field name in record
			cx.content = null
			cx.print(cx.record[dataSource])
			break
		case 'object': // array or object
			if (Array.isArray(dataSource)) { // invoke each array element
				dataSource.forEach(function (value) {
					resolve(cx, value)
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
								data = renderFunction(cx.record)
								cx.content = null
								cx.printRaw(data)
							} else cx.error('Unknown view:' + includedView)
						} else  cx.error('Fragment name not string')
					} else {
						var func = WF.functions[funcName]
						if (func instanceof Function) {
							func.call(cx, params)
						} else cx.error('Unknown rendering function:' + func)
					}
				}
			}
			break
		default:
			cx.error('Unknown rendering data source type:' + typeof dataSource)
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
})()