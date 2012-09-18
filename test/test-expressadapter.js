// test-expressadapter.js
// © Harald Rudell 2012

var expressadapter = require('../lib/expressadapter')
var webfillerinit = require('../lib/webfillerinit')
var viewloader = require('../lib/viewloader')
// https://github.com/haraldrudell/mochawrapper
var assert = require('mochawrapper')
// http://nodejs.org/api/path.html
var path = require('path')
// http://nodejs.org/api/fs.html
var fs = require('fs')

var es = fs.existsSync
var gm = viewloader.getMainView
var iwf = webfillerinit.initWebFiller

exports['Express 2'] = {
	'View with bindings': function () {
		var html = '<title>'
		var options = {
			bindings: {
				'title': 'title',
			},
		}
		var locals = {
			title: 'TITLE',
		}
		var expected = html + locals.title
		var f = expressadapter.compile(html, options)
		var actual = f(locals)
		assert.equal(actual, expected)
	},
	'Default bindings': function () {
		var html = '<h1></h1><body></body>'
		var options = {}
		var locals = {
			title: 'TITLE',
			data: 'DATA',
		}
		var expected = '<h1>TITLE</h1><body>title: TITLE, data: DATA</body>'
		var f = expressadapter.compile(html, options)
		var actual = f(locals)
		assert.equal(actual, expected)
	},
	'Layout view': function () {
		var html = '<title></title><body></body>'
		var options = {
			isLayout: true,
		}
		var locals = {
			title: 'TITLE',
			body: 'BODY'
		}
		var expected = '<title>TITLE</title><body>BODY</body>'
		var f = expressadapter.compile(html, options)
		var actual = f(locals)
		assert.equal(actual, expected)
	},
}

exports['Express 3:'] = {
	'after': function after() {
		fs.existsSync = es
		viewloader.getMainView = gm
	},
	'View': function (done) {
		var file = 'FILE'
		var opts = {
			file: file,
		}
		var html = 'HTML'
		var cbCount = 0
		var renderCbCount = 0

		viewloader.getMainView = mockGetMainView

		expressadapter.__express(file, opts, checkResult)

		function checkResult(err, actual) {
			if (err) assert.equal(err, undefined)
			assert.equal(cbCount, 1)
			assert.equal(renderCbCount, 1)
			assert.equal(actual, html)

			viewloader.getMainView = gm
			done()
		}

		function mockGetMainView(opts, cb) {
			cbCount++
			assert.equal(opts.file, file)
			cb(null, renderFunction)
		}

		function renderFunction(data) {
			renderCbCount++
			return html
		}
	},
	'With layout': function (done) {
		var file = 'FILE'
		var ext = 'html'
		var viewsFolder = __dirname + '/VIEWS'
		var layoutFile = viewsFolder + '/layout.html'
		var opts = {
			file: file,
			layout: true,
			settings: {
				'view engine': ext,
				'views': viewsFolder,
			},
		}
		var html = 'HTML'
		var cbCount = 0
		var renderCbCount = 0

		fs.existsSync = MockExistsSync
		viewloader.getMainView = mockGetMainView

		expressadapter.__express(file, opts, checkResult)

		function checkResult(err, actual) {
			if (err) assert.equal(err.toString(), undefined)
			assert.equal(cbCount, 2)
			assert.equal(renderCbCount, 2)
			assert.equal(actual, html)

			viewloader.getMainView = gm
			done()
		}

		function mockGetMainView(opts, cb) {
			cbCount++
			if (cbCount == 1) assert.equal(opts.file, file)
			if (cbCount == 2) assert.equal(opts.file, layoutFile)
			if (cbCount > 2) assert.equal(cbCount, 2)
			cb(null, renderFunction)
		}

		function renderFunction(data) {
			renderCbCount++
			return html
		}

		function MockExistsSync(file) {
			assert.equal(file, layoutFile)
			return true
		}
	},
}

exports['Add routes:'] = {
	'after': function after() {
		webfillerinit.initWebFiller = iwf
	},
	'Test': function (done) {
		var app = {
			settings: {
				views: path.join(__dirname, 'testviews', 'home'),
			},
			get: mockGet,
			handle: true,
		}
		var routes = [
			{
				url: 'URL',
				handler: 'HANDLER',
			}
		]
		var urls = []
		var handlers = []

		webfillerinit.initWebFiller = mockInitWebFiller
		expressadapter.addRoutes({}, app, checkResult)

		function checkResult(err) {
			if (err) assert.equal(err.toString(), undefined)
			assert.deepEqual(urls, ['/' + routes[0].url])
			assert.deepEqual(handlers, [routes[0].handler])

			done()
		}

		function mockGet(url, handler) {
			urls.push(url)
			handlers.push(handler)
		}

		function mockInitWebFiller(defaults, opts, cb) {
			cb(null, routes)
		}
	}
}