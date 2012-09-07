// expressadapter.js
// allows webfiller to integrate with express.js 2 and 3
// © Harald Rudell 2012

var compiler = require('./compiler')
var viewloader = require('./viewloader')
var viewhandler = require('./viewhandler')
var webfillerinit = require('./webfillerinit')
// http://nodejs.org/api/fs.html
var fs = require('fs')
// http://nodejs.org/api/path.html
var path = require('path')
// legacy node.js
if (!fs.exists) fs.exists = path.exists

module.exports = {
	compile: compile,
	__express: __express,
	addRoutes: addRoutes,
}

/*
express 2 adapter

express 2 invokes this TODO when?
added to express:
app.register('html', require('htmlfive'))
app.set('view engine', 'html')

html: string html
options: object
.defaultEngine 'html'
.filename absolute path to the template
.isLayout true if layout otherwise undefined
.root absolute path view folder
this: my module

return value: function rendering to markup for the browser

at renderForExpress2
this: options.scope
locals: object
same as options
.parentView undefined
.layout function present if not isLayout
.isLayout true if layout otherwise undefined
.body present if isLayout
isPartial

we dont' know if it is layout until render
therefore we should compile and cache renderFunctions at render time
*/
function compile(html, options) {
	var bindings = options.isLayout ?
		viewhandler.layoutBindings() :
		options.bindings || viewhandler.defaultBindings()
	var renderFunction = compiler.compileHtml5(html, bindings, this.name)
	return function renderForExpress2(locals) {
		return renderFunction(locals)
	}	
}

/*
express 3 adapter

__express is invoked every time a page is to be rendered
- caching is our responsibility

integration: add to app.js:
app.engine('html', require('webfiller').__express)
app.set('view engine', 'html')

filename: string: absolute path of existing file, including extension
options object:
.cache: boolean: true for caching: 'view cache' settings or value provided to render
._locals: function(obj) adding properties to local
.settings object: express' global settings: env, port, view engine, views
.title
cb(err, str) str: string: result callback

this refers to an Express View object:
.name is view
.defaultEngine, .ext .path .root
.lookup(), .render()

for layout case, we need to return a function first rendering file then rendering layout using that result
for no layout, return a template function based on the file

notes:
options.settings.views is absolute path to views root folder
options.settings['view engine'] is view extension without leading period
express has its own cache for its View objects
*/
function __express(filename, options, callback) {
	// options for rendering the main view
	var lvOpts = {
		file: filename,
		bindings: options.bindings || viewhandler.defaultBindings(),
		domain: this.name,
		cacheFlag: options.cache,
	}
	var output

	// get the main view render function
	viewloader.getMainView(lvOpts, mainViewResult)

	function mainViewResult(err, renderFunction) {
		if (!err) {

			// inject data into main view html
			output = renderFunction(options)
			if (!options.layout) callback(null, output)
			else {

				// get layout render function
				var layout = getLayoutName(options.layout)
				if (layout instanceof Error) callback(layout)
				else {
					lvOpts.file = layout
					lvOpts.bindings = viewhandler.layoutBindings
					viewloader.getMainView(lvOpts, layoutResult)
				}
			}
		} else callback(err)
	}

	function layoutResult(err, layoutFunction) {
		if (!err) {

			// inject data into layout view
			options.body = output
			callback(null, layoutFunction(options))
		} else callback(err)
	}

	// name is options.layout
	function getLayoutName(name) {
		if (!name || typeof name.valueOf() != 'string') name = 'layout'
		if (!path.extname(name)) name += '.' + options.settings['view engine']
		name = path.resolve(options.settings.views, name)
		if (fs.existsSync(name)) return name
		return Error('Layout file not found:' + name)
	}
}

/*
Start Webfiller in express environment
defaults: optional object: settings
app: express app object
callback(err): optional callback
*/
function addRoutes(defaults, app, callback) {
	if (defaults == null) defaults = {}
	if (app == null ||
		(!app.handle && // express 3
		!app.redirects) // express 2
		) end(Error('Second argument must be express app'))
	var wffParent

	// get express view root folder
	var opts = {
		viewFolder: app.settings && app.settings.views,
		defExt: app.settings && app.settings['view engine'] || 'html',
	}
	if (!opts.viewFolder) end(Error('Can not find express view folder'))
	fs.exists(opts.viewFolder, viewFolderResult)

	function viewFolderResult(exists) {
		if (exists) {
			opts.webFillerFolder = path.join(opts.viewFolder, '../public/webfiller')
			wffParent = path.join(opts.webFillerFolder, '..')
			fs.exists(wffParent, wffResult)
		} else end(Error('Express views folder not found: \'' + opts.viewFolder + '\''))
	}

	function wffResult(exists) {
		if (exists) webfillerinit.initWebFiller(defaults, opts, webfillerinitResult)
		else end(Error('Missing folder: \'' + wffParent + '\''))
	}

	function webfillerinitResult(err, routes) {
		if (!err) {
			// base handlers are inserted prior to rendering handler for things like authentication
			 var baseHandlers = defaults != null &&
			 	defaults.webfiller &&
			 	defaults.webfiller.handlers ||
			 	[]

			// add routing to express
			routes.forEach(function (routing) {
				app.get.apply(app, ['/' + routing.url].concat(baseHandlers, routing.handler))
			})
			var f = defaults.init && defaults.init.logger || console.log
			f('Webfiller routes: ' + routes.length)
		}
		end(err)
	}

	function end(err) {
		if (callback) callback(err)
		// errors thrown here prevent webfiller from functioning
		else if (err) throw err
	}
}