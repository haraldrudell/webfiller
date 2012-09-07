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
				js:[path.join(testViews, 'index', 'indexfrontend.js'),
					path.join(testViews, 'index', 'index_2.js')],
				handler: {
					publicFragments: {
						frag: {
							fragment: 'frag2',
						},
					},
				},
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
			frontEnd: '_1',
			dualSide: '_2.js',
			fragments: path.join(testViews, 'fragments'),
		})
		assert.equal(typeof actual, 'object', 'viewStructure not object')
		assert.deepEqual(Object.keys(actual).sort(), Object.keys(expected).sort(), 'scanner has incorrect domain collection')
		// check each domain: index, '', home
		for (var domain in actual) {
			checkDomain(actual[domain], expected[domain])
		}

		function checkDomain(actual, expected) {

			// verify that this domain has all the expected property keys
			if (verifyObject(actual, expected, 'Domain ' + domain)) {

				// handler and fragment exports ok
				if (verifyObject(actual.handler, expected.handler, 'Domain ' + domain + ' handler')) {
					verifyObject(actual.handler.fragments, expected.handler.fragments, 'Domain ' + domain + ' fragments', true)
					verifyObject(actual.handler.publicFragments, expected.handler.publicFragments, 'Domain ' + domain + ' publicFragments', true)
				}

				// file keys ok
				verifyObject(actual.css, expected.css, 'Domain ' + domain + ' css file list')
				verifyObject(actual.js, expected.js, 'Domain ' + domain + ' js file list')

				// domain and folder
				assert.equal(actual.domain, expected.domain, 'Domain ' + domain + ' has incorrect domain name')
				assert.equal(actual.fragmentFolder, expected.fragmentFolder, 'Domain ' + domain + ' has incorrect fragment folder')
			}
		}

		/*
		Verify a domain
		actual, expected
		heading: what field is being tested
		de: optional boolean: do a deep equal rather than only verify object keys
		*/
		function verifyObject(actual, expected, heading, de) {
			var result
			if ((result = typeof actual == 'object') || de) {
				assert.deepEqual(
					de ? actual : Object.keys(actual).sort(),
					de ? expected : Object.keys(expected).sort(),
					heading + ' has incorrect properties')
			} else assert.equal(actual, expected, heading + ' bad')
			return result
		}
	},
}