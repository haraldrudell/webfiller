// webfillerinit.js
// configures routes for express and writes resources to the public folder
// (c) Harald Rudell 2012

var viewloader = require('./viewloader')
var viewhandler = require('./viewhandler')
// http://nodejs.org/api/path.html
var path = require('path')
// http://nodejs.org/api/fs.html
var fs = require('fs')
if (!fs.existsSync) fs.existsSync = path.existsSync

module.exports = {
	initWebFiller: initWebFiller,
}

var viewConfigurations = {
	'index': {
		url: ''
	}
}

/*
initialize webfiller
viewFolder: absolute path to the view folder a string typically ending with '../views'
defExt: defaqult view extension eg. 'html'
webFillerFolder: absolute path to where webfiller should write css and js
callback(err)
*/
function initWebFiller(defaults, viewFolder, defExt, webFillerFolder, callback) {
	if (typeof defaults != 'object') defaults = {}

	// array of object: .url string url, .handler function
	var result = []

	viewloader.setParameters(viewFolder, defExt, false)
	var views = topLevelViews(viewFolder, defExt)

	// create index.css and index.js
	if (!fs.exists(webFillerFolder)) fs.mkdir(webFillerFolder)
	var fds = {
		css: {
			wrote: false,
			fd: fs.openSync(path.join(webFillerFolder, 'index.css'), 'w')
		}, js: {
			wrote: false,
			fd: fs.openSync(path.join(webFillerFolder, 'index.js'), 'w')
		}
	}

	// the browser first need runtime to define the WF object
	// placing the runtime first allows its function to be overridden
	append(path.join(__dirname, 'runtime.js'), fds.js)

	// object to dedupe render functions
	var renderFunctions = {}

	// iterate over each view
	var cbCounter = 1
	views.forEach(function (view) {
		cbCounter++
		configureView(view)
	})
	viewComplete()

	// do the final callback
	function viewComplete(err) {
		if (--cbCounter == 0) {

			// finally, the browser needs the render function
			append(path.join(__dirname, 'renderengine.js'), fds.js)

			fs.closeSync(fds.css.fd)
			fs.closeSync(fds.js.fd)
			if (callback) callback(err, result)
			else if (err) throw err
		}
	}

	// process a view, like 'index'
	function configureView(view) {

		// assume the default view handler
		var getHandler = viewhandler.getHandler

		// see if there is a sibling folder by the same name as the view
		var viewSubfolder = path.join(viewFolder, view)
		if (fs.existsSync(viewSubfolder)) {

			// check if a handler js file exists (viewfolder)/index/index.js
			var viewHandlerFile = path.join(viewSubfolder, view + '.js')
			if (fs.existsSync(viewHandlerFile)) {

				// get the custom handler for the route
				var handlerModule = require(viewHandlerFile)
				if (handlerModule.getHandler) getHandler = handlerModule.getHandler

				// forward any fragments to the frontend
				if (handlerModule.fragments) {
					for (var fragmentName in handlerModule.fragments) {
						cbCounter++
						writeFragment(handlerModule.fragments[fragmentName], fragmentName)
					}
				}
			}

			// check for css and JavaScript i the sibling folder, forward to frontend
			fs.readdirSync(viewSubfolder).forEach(function (entry) {
				var absolute = path.join(viewSubfolder, entry)

				// append css and js files to the public folder
				if (entry.slice(-4) == '.css') append(absolute, fds.css)
				else if (entry.slice(-5) == '_1.js' || entry.slice(-5) == '_2.js') append(absolute, fds.js)
			})
		}

		// if there is defaults.view.index, use that as settings for the view
		// otherwise viewconfigurations.index
		// otherwise nothing
		var viewConfiguration = defaults.view && defaults.view[view] ||
			viewConfigurations[view] || {}

		result.push({
			url: viewConfiguration.url != null ? viewConfiguration.url : view,
			handler: getHandler(defaults, view)
		})

		viewComplete()
	}

	// write each defined fragment as JavaScript source for the front end
	// fragment: .view, .bindings
	// fragmentName: string: name of the frontend function
	function writeFragment(fragment, fragmentName) {
		var absolute = path.join(viewFolder, fragment.view + '.' + defExt)
		var cacheKey = viewloader.getCacheKey(absolute, fragment.bindings)
		if (!renderFunctions[cacheKey]) {
			renderFunctions[cacheKey] = true

			// add the new fragment
			viewloader.loadView(absolute, fragment.bindings, function (err, renderFunction) {
				if (!err) appendBuf(renderFunction.getSource(fragmentName), fds.js)
				viewComplete(err)
			})
		}
	}

}

function append(file1, fdx) {
	var buf = fs.readFileSync(file1)
	appendBuf(buf, fdx)
}

function appendBuf(buf, fdx) {
	if (fdx.wrote) {
		fs.writeSync(fdx.fd, '\n')
	}
	if (typeof buf == 'string') fs.writeSync(fdx.fd, buf)
	else fs.writeSync(fdx.fd, buf, 0, buf.length)
	if (buf.length) fdx.wrote = true	
}

// get list of top level views
// return value: array of string, eg. ['index']
function topLevelViews(folder, extension) {
	var result = []
	extension = '.' + extension
	fs.readdirSync(folder).forEach(function (entry) {
		if (path.extname(entry) == extension) {
			result.push(path.basename(entry, extension))
		}
	})
	return result
}