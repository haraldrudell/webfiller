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