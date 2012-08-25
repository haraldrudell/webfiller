// test-viewscanner.js
// © Harald Rudell 2012

var viewscanner = require('../lib/viewscanner')
var assert = require('mochawrapper')
// http://nodejs.org/api/path.html
var path = require('path')

var testViews = path.join(__dirname, 'testviews')

exports['Scan:'] = {
	'Build view description': function () {
		var expected = {
			index: {
				css:[path.join(testViews, 'index', 'index.css')],
				js:[path.join(testViews, 'index', 'index_1.js'),
					path.join(testViews, 'index', 'index_2.js')],
				handler: {},
				fragmentFolder: path.join(testViews, 'index'),
				domain: 'index',
			},
			'': {
				css:[],
				js:[],
				handler: {},
				fragmentFolder: path.join(testViews, 'fragments'),
				domain: '',
			},
			home: {
				css: [path.join(testViews, 'home', 'home.css')],
				js: [],
				fragmentFolder: path.join(testViews, 'home'),
				domain: 'home',
			},
		}
		var actual = viewscanner.scan({
			folder: testViews,
			viewExt: 'html',
			cssExt: 'css',
			handlerExt: 'js',
			frontEnd: '_1.js',
			dualSide: '_2.js',
			fragments: path.join(testViews, 'fragments'),
		})
		// actual: viewStructure
		assert.equal(typeof actual, 'object')
		assert.deepEqual(Object.keys(actual).sort(), Object.keys(expected).sort())
		// index
		assert.equal(typeof actual.index, 'object')
		assert.deepEqual(Object.keys(actual.index).sort(), Object.keys(expected.index).sort())
		assert.ok(actual.index.handler)
		assert.deepEqual(actual.index.css, expected.index.css)
		assert.equal(actual.index.js.length, expected.index.js.length)
		expected.index.js.forEach(function (absolute) {
			assert.ok(~actual.index.js.indexOf(absolute))
		})
		assert.equal(actual.index.fragmentFolder, expected.index.fragmentFolder)
		// home
		assert.equal(typeof actual.home, 'object')
		assert.deepEqual(Object.keys(actual.home).sort(), Object.keys(expected.home).sort())
		assert.deepEqual(actual.home.css, expected.home.css)
		assert.deepEqual(actual.home.js, expected.home.js)
		assert.equal(actual.home.fragmentFolder, expected.home.fragmentFolder)
		// fragments
		assert.equal(typeof actual[''], 'object')
		assert.deepEqual(Object.keys(actual['']).sort(), Object.keys(expected['']).sort())
		assert.ok(actual[''].handler)
		assert.equal(actual[''].fragmentFolder, expected[''].fragmentFolder)
	},
}