// test-viewhandler.js
// © Harald Rudell 2012

var viewhandler = require('../lib/viewhandler')
var assert = require('mochawrapper')

exports['Default Viewhandler:'] = {
	'Default getHandler': function () {
		var layout = 'Layout'
		var view = 'aview'
		var expectedOpts = {title: view.substring(0, 1).toUpperCase() + view.substring(1),
			layout: layout}
		var cbCount = 0
		var handler = viewhandler.getHandler({layout: layout}, view)
		assert.equal(typeof handler, 'function', 'getHandler should return function')
		var mockResponse = {render: mockRender}
		handler(null, mockResponse)
		assert.equal(cbCount, 1, 'Incorrect number of render invocations')
		function mockRender(actualView, opts) {
			cbCount++
			assert.equal(actualView, view, 'default handler view name bad')
			assert.deepEqual(opts, expectedOpts)
		}
	},
	'Default layout bindings': function () {
		var actual = viewhandler.layoutBindings()
		assert.deepEqual(actual, {title: 'title', body: {raw: 'body'}})
	},
	'Default bindings': function () {
		var actual = viewhandler.defaultBindings()
		assert.deepEqual(actual, {h1: 'title', body: '',})
	},
}