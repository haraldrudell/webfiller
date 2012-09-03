// runtime.js
// the WF object and built-in runtime functions
// © Harald Rudell 2012
// code may run on server or in browser

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

	/*
	built-in render functions
	defined early so that they can be overridden
	*/

	WF.functions.noContent = function(params) {
		this.suppressContent()
		return this.resolve(params)
	}

	WF.functions.append = function (params) {
		this.printRaw(this.suppressContent())
		return this.resolve(params)
	}

	var classRegExp = /[^ \t\n\f\r]+/gm
	WF.functions.addClass = function (params) {
		var list = this.resolve(params)
		if (!Array.isArray(list)) list = [list]
		var classes = this.cloneTag().c
		list.forEach(function (value) {
			var classArray = value.match(classRegExp)
			if (classArray) {
				classArray.forEach(function (className) {
					if (!~classes.indexOf(className)) classes.push(className)
				})
			}
		})
	}

	WF.functions.removeClass = function (params) {
		var list = this.resolve(params)
		if (!Array.isArray(list)) list = [list]
		var classes = this.cloneTag().c
//console.log('list', require('haraldutil').inspectDeep(list))
		list.forEach(function (value) {
			var classArray = value.match(classRegExp)
			if (classArray) {
				classArray.forEach(function (className) {
					var index = classes.indexOf(className)
					if (~index) classes.splice(index, 1)
				})
			}
		})
	}

	WF.functions.attribute = function (params) {
		var attributes = this.cloneTag().a
		for (var attributeName in params) {
			var value = params[attributeName]
			if (value === false) delete attributes[attributeName]
			else {
				value = this.resolve(value)
				if (Array.isArray(value)) value = value.join(' ')
			 	attributes[attributeName] = value
			}
		}
	}

	WF.functions.raw = function (params) {
		this.printRaw(this.resolve(params))
	}

})(typeof module == 'object' && !!module.exports)