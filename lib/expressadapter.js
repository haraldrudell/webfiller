// expressadapter.js
// allows htmlfive to be used with express
// (c) Harald Rudell 2012

var compiler = require('./compiler')
var viewloader = require('./viewloader')
var viewhandler = require('./viewhandler')
var webfillerinit = require('./webfillerinit')
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
	var renderFunction = compiler.compileHtml5(html, bindings)
	return function renderForExpress2(locals) {
		return renderFunction(locals)
	}	
}

/*
express 3 adapter

__express is invoked every time a page is to be rendered
added to express:
app.engine('html', require('htmlfive').__express)
app.set('view engine', 'html')

filename: string: absolute path of existing file, including extension
options object:
.cache: boolean: true if 'view cache' settings enabled
.locals(obj)
.settings object: env, port, view engine, views
.title
cb(err, str) str: string

for layout case, we need to return a function first rendering file then rendering layout using that result
for no layout, return a template function based on the file

if a view does not have an extension, the default extension is added
if the view is not an absolute path the root folder is prepended
if that view does not exist, its considered a folder with a file index.ejs in it

How do you know that the default layout is called layout?

notes:
options.settings.views is absolute path to views root folder
options.settings['view engine'] is view extension without leading period
*/
function __express(filename, options, callback) {

	// get renderFunction for filename
	var bindings = options.bindings || viewhandler.defaultBindings()
	viewloader.loadView(filename, bindings, function (err, renderFunction) {
		if (!err) {
			var output = renderFunction(options)
			if (!options.layout) callback(null, output)
			else {
				var layout = getLayoutName(options.layout)
				if (layout instanceof Error) callback(layout)
				viewloader.loadView(layout, viewhandler.layoutBindings, function (err, layoutFunction) {
					if (!err) {
						options.body = output
						callback(null, layoutFunction(options))
					} else callback(err)
				},  options.cache)		
			}
		} else callback(err)
	},  options.cache)

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