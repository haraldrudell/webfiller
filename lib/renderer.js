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
		exports.render = render
	}
	// browser and Node: export render to the WF object
	WF.render = render

	/*
	render function: inserts data from record into html
	record: key-value json object
	viewExecutable: a structure from compileHtml5 or a fragmentName or fragmentName.domain
	domain: optional string suggested domain

	included fragments:
	on server: provided by renderInclude
	in browser: provided by WF.fragments
	*/
	function render(record, viewExecutable, domain) {
		record = Object(record)

		// for browser, allow rendering by fragment name
		if (typeof viewExecutable == 'string') {
			viewExecutable = getFragment(viewExecutable, domain)
			if (typeof viewExecutable == 'string') return viewExecutable
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
			resolve: resolve,
			print: print,
			printRaw: printRaw,
			error: print,
			cloneTag: cloneTag,
			suppressContent: suppressContent,
			suppressTag: suppressTag,
			getField: getField,
			domain: viewExecutable.domain
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

			var value = resolve.call(renderStep, dataLink.d)
			if (value) {
				if (Array.isArray(value)) value = value.join('')
				print(value)
			}

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
			var result = this.content
			suppressedContent = true
			this.content = ''
			return result
		}

		function suppressTag() {
			suppressedTag = true
		}

		function print(str) {
			printRaw(WF.functions.textToNormal(str))
		}

		function printRaw(str) {
			prints.push(String(str))
		}

		function printTag(t) {
			var tagText = []
			tagText.push('<')
			tagText.push(t.t)

			if (t.c.length) {
				tagText.push(' class=')
				var classValue = t.c.join(' ')

				// unquoted or double-quoted
				var func = hasAnyOf(classValue, '"\'=>< \t\n\f\r`') ?
					WF.functions.textToDoubleQuotedAttributeValue :
					WF.functions.textToUnquotedAttributeValue

				tagText.push(func(classValue))
			}
			for (var attribute in t.a) {
				tagText.push(' ')
				tagText.push(attribute)
				var value = t.a[attribute]
				if (value) {
					tagText.push('=')
					tagText.push(WF.functions.textToUnquotedAttributeValue(value))
				}
			}
			if (t.v) tagText.push('/')
			tagText.push('>')
			result.push(tagText.join(''))
		}

		function hasAnyOf(s, chars) {
			var result = false
			for (var index in chars)
				if (~s.indexOf(chars[index])) {
					result = true
					break
				}
			return result
		}

	} // render

	/*
	resolve an expression
	this reference contains data for the rendering
	return value:  string or array of string
	*/
	function resolve(dataSource) {
		var result = ''
		switch (typeof dataSource) {
		case 'string': // insert data ahead of tag contents
			var result = this.getField(dataSource)
			if (typeof result == 'object') {
				var t = []
				for (var p in result) t.push(p + ': ' + String(result[p]))
				result = t.join(', ')
			} else result = String(result)
			break
		case 'object': // array or object
			var resultsArray = []
			if (Array.isArray(dataSource)) { // array: resolve each element
				var self = this

				// build array of results
				dataSource.forEach(function (value) {
					if (typeof value == 'string') {
						if (value) resultsArray.push(value)
					} else {
						var val = resolve.call(self, value)
						if (Array.isArray(val)) resultsArray.push.apply(resultsArray, val)
						else resultsArray.push(val)
					}
				})

			} else { // object: keys are function names
				for (var funcName in dataSource) {
					var params = dataSource[funcName]

					// native function 'fragment'
					if (funcName == 'fragment' ||
						funcName == 'getFragment') {

						// get renderFunction
						var fragmentName = resolve.call(this, params)
						if (Array.isArray(fragmentName)) fragmentName = fragmentName.join('')
						var getFunc = isNode ? require('./compiler').getFragment : getFragment
						var renderFunction = getFunc(fragmentName, this.domain)
						if (typeof renderFunction == 'function') {

							// render the fragment
							var data = renderFunction(this.getField(''))
							if (funcName == 'fragment') this.printRaw(data)
							else if (data) resultsArray.push(data)
						} else this.error(String(renderFunction))
					} else {
						var func = WF.functions[funcName]
						if (func instanceof Function) {
							var value = func.call(this, params)
							if (!Array.isArray(value)) value = [value]
							value.forEach(function (val) {
								if (val != null) {
									if (typeof val == 'string') {
										if (val) resultsArray.push(val)
									} else resultsArray.push(String(val))
								}
							})
						} else this.error('Unknown rendering function:' + funcName)
					}
				}
			}

			// update result with resultsArray
			if (resultsArray.length) {
				if (resultsArray.length == 1) result = String(resultsArray[0])
				else {
					resultsArray.forEach(function (value, index) {
						if (typeof value != 'string') resultsArray[index] = String(value)
					})
					result = resultsArray
				}
			}

			break
		default:
			this.error('Unknown rendering data source type:' + typeof dataSource)
		}

		return result
	}

	// clone enumerable properties: shallow clone
	function clone(o) {
		var result = {}
		if (typeof(o) != 'object') result = o
		else if (Array.isArray(o)) result = o.slice()
		else for (var p in o) result[p] = o[p]
		return result
	}

	/*
	resolve a fragment, only in browser
	fragmentname: string fragmentname or fragmentname.domain
	domain: optional string

	return value: object on success
	otherwise string: searched f.d
	*/
	function getFragment(fragmentName, domain) {
		var result

		// get key
		var key
		var split = fragmentName.split('.')
		if (split.length > 1) key = split[0] + '.' + split[1]
		else {
			var domains = WF.directory[split[0]]
			var d = domains  && domains[domain || 0]
			if (d) key = split[0] + '.' + d
			else result = split[0]
		}

		// result to object or the string search key
		if (key && !(result = WF.fragments[key])) result = key

		if (typeof result == 'string') result = 'Unknown fragment:' + result

		return result
	}

})(typeof module == 'object' && !!module.exports, // isNode
typeof module == 'object' && !!module.exports ? require('./runtime').WF : WF) // WF