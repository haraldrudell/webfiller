// test-scanviews.js

var scanviews = require('../lib/scanviews')
// http://nodejs.org/api/path.html
var path = require('path')

exports.testScan = function (test) {
	var viewFolder = path.join(__dirname, 'data', 'views')
	var expected = {
		index: {
			css:[path.join(viewFolder, 'index', 'index.css')],
			js:[path.join(viewFolder, 'index', 'index_1.js'),
				path.join(viewFolder, 'index', 'index_2.js')],
			handler: {},
		},
		'': {
			css:[],
			js:[],
			handler: {},
		},
		home: {
			css: [path.join(viewFolder, 'home', 'home.css')],
			js: [],
		},
	}
	var actual = scanviews.scan({
		folder: viewFolder,
		viewExt: 'html',
		cssExt: 'css',
		handlerExt: 'js',
		frontEnd: '_1.js',
		dualSide: '_2.js',
		fragments: path.join(__dirname, 'data', 'views', 'fragments'),
	})
	// actual
	test.equal(typeof actual, 'object')
	test.deepEqual(Object.keys(actual).length, Object.keys(expected).length)
	// index
	test.equal(typeof actual.index, 'object')
	test.equal(Object.keys(actual.index).length, Object.keys(expected.index).length)
	test.ok(actual.index.handler)
	test.deepEqual(actual.index.css, expected.index.css)
	test.equal(actual.index.js.length, expected.index.js.length)
	expected.index.js.forEach(function (absolute) {
		test.ok(~actual.index.js.indexOf(absolute))
	})
	// home
	test.equal(typeof actual.home, 'object')
	test.equal(Object.keys(actual.home).length, Object.keys(expected.home).length)
	test.deepEqual(actual.home.css, expected.home.css)
	test.deepEqual(actual.home.js, expected.home.js)
	// fragments
	test.equal(typeof actual[''], 'object')
	test.equal(Object.keys(actual['']).length, Object.keys(expected['']).length)
	test.ok(actual[''].handler)

	test.done()
}