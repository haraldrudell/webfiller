// test-viewloader.js
// © Harald Rudell 2012

var viewloader = require('../lib/viewloader')
var fragmentcache = require('../lib/fragmentcache')
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

exports['Fragments:'] = {
	'Domain Specified': function () {
		var viewStructure = {
			index: {
				domain: 'index',
				fragmentFolder: path.join(testViews, 'index'),
				handler: {
					fragments: {
						frag: {},
						other: {
							'-view': 'frag',
						}
					},
				},
			},
		}
		var expected = '<div>frag.index</div>'

		viewloader.setParameters(viewStructure, 'html')
		var renderFunction = viewloader.getFragment('frag.index', 'c', true)
		assert.equal(typeof renderFunction, 'function')
		var actual = renderFunction({})
		assert.equal(actual, expected)
	},
	'Cache write': function () {
		var viewStructure = {
			index: {
				domain: 'index',
				fragmentFolder: path.join(testViews, 'index'),
				handler: {
					fragments: {
						frag: {},
						other: {
							'-view': 'frag',
						}
					},
				},
			},
		}
		var expected = '<div>frag.index</div>'
		var fragmentDirectory = fragmentcache.getCache()

		viewloader.setParameters(viewStructure, 'html', fragmentDirectory)
		var renderFunction = viewloader.getFragment('frag', 'c', true)
		if (typeof renderFunction == 'string') assert.equal(renderFunction, '')
		assert.equal(typeof renderFunction, 'function')
		var actual = renderFunction({})
		assert.equal(actual, expected, {})
	},
}