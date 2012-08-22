// webfiller.js
// adapter for using pure html5 with express
// © Harald Rudell 2012

/*
1. An htmlfive view is pure unmodified html5
2. The view and a bindings json object is compiled into a JavaScript render function
3. At runtime, the render uses json data to produces browser-ready html.
4. Rendering can happen in the server or the browser
*/

module.exports = merge(
	require('./expressadapter'),
	require('./webfillerinit'),
	{
		WF: require('./runtime').WF
	},
	{
		compileHtml5: require('./compiler').compileHtml5
	}
)

// create an object with the enumerable properties of all provided arguments
// same name properties from later objects overwrite
// return value: Object object with only enumerable properties
function merge() {
	var result = {}
	Array.prototype.slice.call(arguments, 0).forEach(function (argument) {
		for (var property in argument) result[property] = argument[property]
	})
	return result
}