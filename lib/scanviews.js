// scanviews.js

// http://nodejs.org/api/fs.html
var fs = require('fs')
// http://nodejs.org/api/path.html
var path = require('path')

if (!fs.existsSync) fs.existsSync = path.existsSync

exports.scan = scan

/*
describe view configurations
opts: object
.folder absolute path view folder
.viewExt: extension for views 'html'
.cssExt: extension for styling 'css'
.handlerExt: extension for handler files 'js'
.frontEnd: ending for front end JavaScript '_1.js'
.dualSide: ending for dual side JavaSCript '_2.js'
.fragments: fully qualified path to an extra folder to scan

return value: object
key: viewname 'index'
value: object
.css array of css absolute paths
.js array of js absolute paths
.handler optional module: the handler module

*/
function scan(opts) {
	var result = {}

	// get the array of views to scan
	var viewArray = topLevelViews(opts.folder, opts.viewExt)
	if (opts.fragments && fs.existsSync(opts.fragments)) {
		viewArray.push('')
	}

	viewArray.forEach(function (view) {
		var viewData = {
			css: [],
			js: [],
		}
		result[view] = viewData

		var viewSubfolder = view.length ? path.join(opts.folder, view) : opts.fragments
		if (view.length == 0) view = 'fragments'
		if (fs.existsSync(viewSubfolder)) {

			// check if a handler js file exists (viewfolder)/index/index.js
			var viewHandlerFile = path.join(viewSubfolder, view + '.' + opts.handlerExt)
			if (fs.existsSync(viewHandlerFile)) viewData.handler = require(viewHandlerFile)

			// look for js and css files
			fs.readdirSync(viewSubfolder).forEach(function (entry) {
				var absolute = path.join(viewSubfolder, entry)
				if (entry.slice(-(1 + opts.cssExt.length)) == '.' + opts.cssExt) viewData.css.push(absolute)
				else if (entry.slice(-opts.frontEnd.length) == opts.frontEnd ||
					entry.slice(-opts.dualSide.length) == opts.dualSide) viewData.js.push(absolute)
			})
		}
	})

	return result
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