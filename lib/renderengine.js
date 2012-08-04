// renderengine.js
// renders using a data record and a viewExecutable object
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

		var result = []
		var contentsIndex = 0
		var flushToIndex

		var renderStep = {
			print: print,
			printRaw: printRaw,
			error: error,
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
								print() // flush then ignore content
							} else {
								print() // flush, then  ignore tag
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

		function error(str) {
			if (typeof str != 'string') str = String(str)
			this.print(str)
		}

		function print(str) {
			printRaw(WF.functions.textToNormal(str))
		}

		// if renderStep.tag is set, flush including this index
		function printRaw(str) {
			if (flushToIndex > contentsIndex) {
				// need to flush first
				if (renderStep.tag) flushToIndex++
				result.push.apply(result, viewExecutable.pieces.slice(contentsIndex, flushToIndex))
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

					// func is now 'append' or '-view:viewname'
					if (funcName.substring(0, 6) == '-view:') {
						var includedView = funcName.substring(6)

						// render view includedView with bindings params
						var renderFunction
						if (isNode) {
							renderFunction = require('./compiler').renderInclude(includedView, params)
						} else {
							renderFunction = WF.views[includedView]
							throw Error('NIY')
						}
						if (renderFunction instanceof Function) {
							data = renderFunction(cx.record)
							cx.content = null
							cx.printRaw(data)
						} else cx.error('Unknown view:' + includedView)
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

})()