// test-fragmentloader.js

var fragmentloader = require('../lib/fragmentloader')
var fragmentcache = require('../lib/fragmentcache')
// http://nodejs.org/api/path.html
var path = require('path')
// https://github.com/haraldrudell/mochawrapper
var assert = require('mochawrapper')

var testViews = path.join(__dirname, 'testviews')

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

		fragmentloader.setParameters(viewStructure, 'html')
		var renderFunction = fragmentloader.getFragment('frag.index', 'c', true)
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

		fragmentloader.setParameters(viewStructure, 'html', fragmentDirectory)
		var renderFunction = fragmentloader.getFragment('frag', 'c', true)
		if (typeof renderFunction == 'string') assert.equal(renderFunction, '')
		assert.equal(typeof renderFunction, 'function')
		var actual = renderFunction({})
		assert.equal(actual, expected, {})
	},
}