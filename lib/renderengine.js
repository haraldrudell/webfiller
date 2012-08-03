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
	} else {

		// in the browser, export rende to the WF object
		WF.render = render
	}

	/*
	runs on server or in browser

	render function instance
	must be self-contained, requires dataLink
	inserts data from record into the html
	record: key-value json object
	*/
	function render(record, viewExecutable) {

		var result = []
		var contentsIndex = 0
		var flushToIndex

		var renderStep = {
			print: print
		}

		// render the data links
		viewExecutable.dataLinks.forEach(function (dataLink) {

			// render include
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
				renderStep.tag = viewExecutable.pieces[dataLink.tag.index]
				renderStep.content = viewExecutable.pieces[dataLink.tag.index + 1]
				renderStep.tagData = dataLink.tag
				renderStep.record = record || {}
				flushToIndex = dataLink.tag.index

				resolve(renderStep, dataLink.linkage)

				// output final data
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
		})

		// output final html
		result.push.apply(result, viewExecutable.pieces.slice(contentsIndex))

		return result.join('')

		function error(str) {
			if (typeof str != 'string') str = String(str)
			this.print(str)
		}

		function print(str) {
			// TODO escaping here
			printRaw(str)
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
			if (dataSource[0] == '-') {
				// special data source
				if (dataSource.substring(0, 6) == '-view:') {
					// include a view
					printRaw()
				} else cx.error('Unknown rendering function:' + func)
			} else {
				cx.content = null
				cx.print(cx.record[dataSource])
			}
			break
		case 'object': // array or object
			if (Array.isArray(dataSource)) { // invoke each array element
				dataSource.forEach(function (value) {
					resolve(cx, value)
				})
			} else { // keys are function names
				for (var func in dataSource) {
					var params = dataSource[func]
					var func = WF.functions[func]
					if (func instanceof Function) {
						func.call(cx, params)
					} else cx.error('Unknown rendering function:' + func)
				}
			}
			break
		default:
			cx.error('Unknown rendering data source type:' + typeof dataSource)
		}
	}

})()