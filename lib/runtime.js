// runtime.js
// functions available to renderengine.js
// code may run on server or in browser

// define the global WF if in browser
if (typeof WF == 'undefined') WF = {
	fragments: {},
	functions: {},
}

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

// wrapper so we have a local scope in the browser
;(function () {

	var isNode = typeof module == 'object' && !!module.exports
	if (isNode) {
		// export WF to other node modules
		module.exports.WF = WF
	}

	WF.functions.append = function(params) {
		this.print(this.content)
		this.print(params == '' ? getAllFields(this.record) : this.record[params])
		this.content = null
	}

	WF.functions.insert = function (params) {
		this.print(params == '' ? getAllFields(this.record) : this.record[params])
	}

	function getAllFields(record) {
		var result = []
		for (var field in record) {
			result.push(field + ':' + record[field])
		}
		return result.join(', ')
	}

})()