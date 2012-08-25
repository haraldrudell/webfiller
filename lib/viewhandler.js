// viewhandler.js
// display views that don't require dedicated code
// © Harald Rudell 2012

module.exports = {
	getHandler: getHandler,
	defaultBindings: defaultBindings,
	layoutBindings: layoutBindings,
}

// a default request handler function to be used by express
function getHandler(defaults, view) {
	var title = view.substring(0, 1).toUpperCase() + view.substring(1)
	var layout = defaults.layout != null ? defaults.layout : true
	return function renderIndex(request, response) {
		var opts = {
			title: title,
			layout: layout,
		}
		response.render(view, opts)
	}
}

/*
1. you render a view
2. a view can include subviews
3. a default enclosing view can be defined (ie. layout)

view instructions must be provided in options variable

1. locations are
1a. tag names 'title'
1b. class words '.class' (default, data key)
1c. ids '#id'
2. operations are
2a. replace (default)
2b. prepend
2c. append
2d. some format...

old:
views
default prepend
inserts
default postpend

*/

// default bindings for a request layout view
function layoutBindings() {
	return {
		// replace the contents of the title tag with the title data field
		'title': 'title',
		// replace the contents of the body tag with the body data field
		'body': 'body',
	}
}

// default bindings for an express view
function defaultBindings() {
	return {
		// replace the content of all h1 elements with the title data field
		'h1': 'title',
		// append the title data field to the contents of all p elements
		'body': '',
	}
}