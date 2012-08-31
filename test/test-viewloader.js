// test-viewloader.js
// © Harald Rudell 2012

var viewloader = require('../lib/viewloader')
// http://nodejs.org/api/path.html
var path = require('path')
// https://github.com/haraldrudell/mochawrapper
var assert = require('mochawrapper')

var testViews = path.join(__dirname, 'testviews')

exports['Main Views:'] = {
	'From Disk': function (done) {
		var opts = {
			cacheFlag: true,
			file: path.join(testViews, 'index.html'),
		}
		var expected = '\n<div></div>'
		viewloader.getMainView(opts, function(err, renderFunction) {
			if (err) assert.equal(err, undefined)
			assert.equal(typeof renderFunction, 'function')
			var actual = renderFunction()
			assert.equal(actual, expected)

			done()
		})
	}
}