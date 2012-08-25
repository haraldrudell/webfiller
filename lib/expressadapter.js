// expressadapter.js
// allows htmlfive to be used with express
// (c) Harald Rudell 2012

var compiler = require('./compiler')
var viewloader = require('./viewloader')
var viewhandler = require('./viewhandler')
var webfillerinit = require('./webfillerinit')
// http://nodejs.org/api/fs.html
var fs = require('fs')
// http://nodejs.org/api/path.html
var path = require('path')

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

	// get renderFunction for filename
	var lvOpts = {
		file: filename,
		bindings: options.bindings || viewhandler.defaultBindings(),
		domain: this.name,
		cacheFlag: options.cache,
	}
	viewloader.getMainView(lvOpts, function (err, renderFunction) {
		if (!err) {
			var output = renderFunction(options)
			if (!options.layout) callback(null, output)
			else {
				var layout = getLayoutName(options.layout)
				if (layout instanceof Error) callback(layout)
				lvOpts.file = layout
				lvOpts.bindings = viewhandler.layoutBindings
				viewloader.getMainView(lvOpts, function (err, layoutFunction) {
					if (!err) {
						options.body = output
						callback(null, layoutFunction(options))
					} else callback(err)
				},  options.cache)		
			}
		} else callback(err)
	},  options.cache)

	// name is options.layout
	function getLayoutName(name) {
		if (!name || typeof name.valueOf() != 'string') name = 'layout'
		if (!path.extname(name)) name += '.' + options.settings['view engine']
		name = path.resolve(options.settings.views, name)
		if (fs.existsSync(name)) return name
		return Error('Layout file not found:' + name)
	}
}

// initial setup of express
function addRoutes(defaults, app, callback) {
	if (typeof defaults != 'object') defaults = {}

	// get express view root folder, output folder and present views
	var opts = {
		viewFolder: app.settings && app.settings.views,
		defExt: app.settings && app.settings['view engine'] || 'html',
	}
	if (!opts.viewFolder) throw Error('Can not find view folder')
	opts.webFillerFolder = path.join(opts.viewFolder, '../public/webfiller')

	webfillerinit.initWebFiller(defaults, opts, function (err, routes) {
		if (!err) {

			// add routing to express
			routes.forEach(function (routing) {
				app.get('/' + routing.url, routing.handler)
			})
		}
		if (callback) callback(err)
		else if (err) throw err
	})
}