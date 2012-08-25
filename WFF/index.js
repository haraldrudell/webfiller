// runtime.js
// the WF object and built-in runtime functions
// © Harald Rudell 2012
// code may run on server or in browser

/*
cx object:
cx.tag: content: the html  of the opening tag '<div class=content>' null for location 0
cx.content: string: the element content up to the first child tag or closing tag: 'text' null for location 0
cx.tagData data structure for the tag or {} for location 0
cx.record the record object provided to render

cx.print(string): prints data escaped for html
cx.printRaw(string): prints including tags
cx.error(Error object): ability to indicate an error condition

params: the bindings object value following the function name
*/
;(function (isNode) {

	// a seed WF if WF is not defined (it isn't)
	var WF = {
		fragments: {},
		functions: {},
		directory: {},
	}

	// export or import WF
	if (isNode) module.exports.WF = WF
	else {
		// in the browser this refers to the elusive global object
		if (typeof this.WF != 'object') this.WF = WF
		else {
			WF = this.WF // import some WF object we found
			if (typeof WF.fragments != 'object') WF.fragments = {}
			if (typeof WF.functions != 'object') WF.functions = {}
			if (typeof WF.directory != 'object') WF.directory = {}
		}
	}

	// built-in render functions

	WF.functions.append = function(params) {
		this.print(this.content)
		this.suppressContent()
		var data = this.getField(params)
		if (typeof data == 'object') {
			var result = []
			for (var p in data) result.push(p + ':' + data[p])
			data = result.join(', ')
		}
		this.print(data)
	}

	WF.functions.replace = function (params) {
		this.suppressContent()
		var data = this.getField(params)
		if (typeof data == 'object') {
			var result = []
			for (var p in data) result.push(p + ':' + data[p])
			data = result.join(', ')
		}
		this.print(data)
	}

	var classRegExp = /[^ \t\n\f\r]+/gm
	WF.functions.addClass = function (params) {
		params = String(params)
		var classArray = params.match(classRegExp)
		if (classArray) {
			var classes = this.cloneTag().c
			classArray.forEach(function (className) {
				if (!~classes.indexOf(className)) classes.push(className)
			})
		}
	}

	WF.functions.removeClass = function (params) {
		params = String(params)
		var classArray = params.match(classRegExp)
		if (classArray) {
			var classes = this.cloneTag().c
			classArray.forEach(function (className) {
				var index = classes.indexOf(className)
				if (~index) classes.splice(index, 1)
			})
		}
	}

	WF.functions.attribute = function (params) {
		var attributes = this.cloneTag().a
		for (var attributeName in params) {
			var value = params[attributeName]
			if (value === false) delete attributes[attributeName]
			else attributes[attributeName] = String(value)
		}
	}

})(typeof module == 'object' && !!module.exports)

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
			print: print,
			printRaw: printRaw,
			error: error,
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
			this.content = ''
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
			var text = this.getField(dataSource)
			if (typeof text == 'object') {
				var t = []
				for (var p in text) t.push(p + ':' + text[p])
				text = t.join(', ')
			}
			this.print(text)
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
							var renderFunction = isNode ?
								require('./compiler').getFragment(params, this.domain) :
								getFragment(params, this.domain)
							if (typeof renderFunction == 'function') {

								// render the fragment
								var data = renderFunction(this.getField(''))
								this.printRaw(data)
							} else this.error(String(renderFunction))
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
// html5text.js
// convert between types of html5 character data
// © Harald Rudell 2012
// code may run in browser or on server

/*
http://dev.w3.org/html5/markup/
http://dev.w3.org/html5/spec/named-character-references.html
http://dev.w3.org/html5/markup/syntax.html#hex-charref

html5 text:
http://dev.w3.org/html5/markup/syntax.html#syntax-text
text does not contain:
control characters other than html5 space characters
permanently undefined unicode characters
*/
;(function (isNode, WF) {

	// the functions this file exports
	var funcs = {
		textToNormal: textToNormal,
		textToReplaceable: textToReplaceable,
		textToAttributeName: textToAttributeName,
		textToUnquotedAttributeValue: textToUnquotedAttributeValue,
		textToDoubleQuotedAttributeValue: textToDoubleQuotedAttributeValue,		
	}

	if (isNode) module.exports = funcs

	// both browser and Node: export to WF
	for (var func in funcs) WF.functions[func] = funcs[func]

	/*
	escape text for use as normal character data
	http://dev.w3.org/html5/markup/syntax.html#normal-character-data
	&amp; &lt;
	*/
	function textToNormal(str) {
		return String(str)
			.replace(/&/g, '&amp;')
			.replace(/</g, '&lt;')
	}

	/*
	escape text for use in title and textarea elements
	http://dev.w3.org/html5/markup/syntax.html#replaceable-character-data
	ambiguous ampersands we don't care about
	make sure we do not have any closing tags
	insert a space if a closing tag is found
	*/
	function textToReplaceable(str, tag) {

		// insert space after ambiguous ampersands
		var result = String(str).replace(/&./gm, function(match) {
			if (match.length == 2) {
				if (' <&'.indexOf(match[1]) == -1) {
					match = '& ' + match[1]
				}
			}
			return match
		})

		// insert space to avoid text that contains a closing tag
		// this function applies to title and textarea elements
		if (!tag) tag = 'title'
		var regExp = new RegExp('<\/' + tag, 'gim')

		return result.replace(regExp, function(match) {
				return match.substring(0, 2) + ' ' + match.substring(2)
			})
	}

	/*
	escape text for use as attribute name
	http://dev.w3.org/html5/markup/syntax.html#attribute-name
	note that an empty string is an illegal value
	&quot; &apos; &gt; &sol; &equals;
	space characters: space \t\n\f\r
	*/
	function textToAttributeName(str) {
		return textToNormal(str)
			.replace(/"/, '&quot;')
			.replace(/'/, '&apos;')
			.replace(/>/, '&gt;')
			.replace(/\//, '&sol;')
			.replace(/=/, '&equals;')
			.replace(/ /, '&#x20;')
			.replace(/\t/, '&#x9;')
			.replace(/\n/, '&#xa;')
			.replace(/\f/, '&#xc;')
			.replace(/\r/, '')
	}

	/*
	escape text for use as unquoted attribute value
	http://dev.w3.org/html5/markup/syntax.html#attr-value-unquoted
	note: empty string is an illegal value
	&acute; &apos; &quot; &gt;
	*/
	function textToUnquotedAttributeValue(str) {
		return String(str)
			.replace(/"/, '&quot;')
			.replace(/'/, '&apos;')
			.replace(/=/, '&equals;')
			.replace(/>/, '&gt;')
			.replace(/</g, '&lt;')
			.replace(/ /, '&#x20;')
			.replace(/\t/, '&#x9;')
			.replace(/\n/, '&#xa;')
			.replace(/\f/, '&#xc;')
			.replace(/\r/, '')
			.replace(/`/, '&grave;')
	}

	// escape text for use as unquoted attribute value
	function textToDoubleQuotedAttributeValue(str) {
		return '"' +
			String(str).replace(/"/, '&quot;')
			+ '"'
	}

})(typeof module == 'object' && !!module.exports, // isNode
typeof module == 'object' && !!module.exports ? require('./runtime').WF : WF) // WF
