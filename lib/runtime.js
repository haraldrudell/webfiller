// runtime.js
// functions available to renderengine.js
// code may run on server or in browser

// define the global WF if in browser
if (typeof WF == 'undefined') WF = {
	views: {},
	function: {},
}

// wrapper so we have a local scope in the browser
;(function () {

	var isNode = typeof module == 'object' && !!module.exports
	if (isNode) {
		// export WF to other node modules
		module.exports.WF = WF
	}

	WF.append = function(cx, params) {
		cx.print(cx.content)
		cx.print(params = '' ? getAllFields(cx.record) : cx.record[params])
		cx.content = null
	}

	WF.insert = function (cx, params) {
		cx.print(params = '' ? getAllFields(cx.record) : cx.record[params])
	}

	function getAllFIelds(record) {
		var result = []
		for (var field in record) {
			result.push(field + ':' + record[field])
		}
		return result.join(', ')
	}

})()