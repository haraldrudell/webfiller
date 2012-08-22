// test-viewscanner.js
// © Harald Rudell 2012

var viewscanner = require('../lib/viewscanner')
var assert = require('mochawrapper')
// http://nodejs.org/api/path.html
var path = require('path')

exports['Scan:'] = {
	'Build view description': function () {
		var viewFolder = path.join(__dirname, 'data', 'views')
		var expected = {
			index: {
				css:[path.join(viewFolder, 'index', 'index.css')],
				js:[path.join(viewFolder, 'index', 'index_1.js'),
					path.join(viewFolder, 'index', 'index_2.js')],
				handler: {},
				fragmentFolder: path.join(viewFolder, 'index'),
			},
			'': {
				css:[],
				js:[],
				handler: {},
				fragmentFolder: path.join(viewFolder, 'fragments'),
			},
			home: {
				css: [path.join(viewFolder, 'home', 'home.css')],
				js: [],
				fragmentFolder: path.join(viewFolder, 'home'),
			},
		}
		var actual = viewscanner.scan({
			folder: viewFolder,
			viewExt: 'html',
			cssExt: 'css',
			handlerExt: 'js',
			frontEnd: '_1.js',
			dualSide: '_2.js',
			fragments: path.join(__dirname, 'data', 'views', 'fragments'),
		})
		// actual
		assert.equal(typeof actual, 'object')
		assert.deepEqual(Object.keys(actual).length, Object.keys(expected).length)
		// index
		assert.equal(typeof actual.index, 'object')
		assert.equal(Object.keys(actual.index).length, Object.keys(expected.index).length)
		assert.ok(actual.index.handler)
		assert.deepEqual(actual.index.css, expected.index.css)
		assert.equal(actual.index.js.length, expected.index.js.length)
		expected.index.js.forEach(function (absolute) {
			assert.ok(~actual.index.js.indexOf(absolute))
		})
		assert.equal(actual.index.fragmentFolder, expected.index.fragmentFolder)
		// home
		assert.equal(typeof actual.home, 'object')
		assert.equal(Object.keys(actual.home).length, Object.keys(expected.home).length)
		assert.deepEqual(actual.home.css, expected.home.css)
		assert.deepEqual(actual.home.js, expected.home.js)
		assert.equal(actual.home.fragmentFolder, expected.home.fragmentFolder)
		// fragments
		assert.equal(typeof actual[''], 'object')
		assert.equal(Object.keys(actual['']).length, Object.keys(expected['']).length)
		assert.ok(actual[''].handler)
		assert.equal(actual[''].fragmentFolder, expected[''].fragmentFolder)
	},
}