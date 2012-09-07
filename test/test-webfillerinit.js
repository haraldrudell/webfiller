// test-webfillerinit.js
// © Harald Rudell 2012

var webfillerinit = require('../lib/webfillerinit')
// https://github.com/haraldrudell/mochawrapper
var assert = require('mochawrapper')
// http://nodejs.org/api/path.html
var path = require('path')
// http://nodejs.org/api/fs.html
var fs = require('fs')

var filewriter = require('../lib/filewriter')
var fw

var viewscanner = require('../lib/viewscanner')
var sc

outputFolder = path.join(__dirname, 'tmp')

exports['Webfiller:'] = {
	'before': function () {
		if (!fs.existsSync(outputFolder)) fs.mkdirSync(outputFolder)
		sc = viewscanner.scan
		fw = filewriter.write
	},
	'after': function () {
		viewscanner.scan = sc
		filewriter.write = fw
	},
	'Init': function(done) {
		var cbOpts = []
		var expectedOpts = [{folder: 'VF',
			viewExt: 'EXT',
			cssExt: 'css',
			handlerExt: 'js',
			frontEnd: '_1',
			dualSide: '_2.js',
			fragments: 'VF/fragments',
		}]
		var opts = {
			viewFolder: 'VF',
			defExt: 'EXT',
			webFillerFolder: outputFolder,
		}
		var viewStructure = {
			'index': {
				js: [],
			}, // url should be '', using derfault handler
			'home': {
				js: [],
				handler: {
					getHandler: mockGetHandler,
				},
			},
		}
		var expectedFw = [outputFolder, viewStructure,"index", 'EXT']
		var expectedConfig = {
			'': false,
			'home': 'HANDLER',
		}

		viewscanner.scan = mockScan
		filewriter.write = mockFileWriter
		webfillerinit.initWebFiller({}, opts, checkResult)

		function checkResult(err, result) {
			if (err) assert.equal(err, undefined)
			assert.deepEqual(cbOpts, expectedOpts)
			assert.ok(Array.isArray(result))
			assert.equal(result.length, Object.keys(expectedConfig).length)
			result.forEach(function (urlConf) {
				assert.equal(typeof urlConf, 'object')				
				assert.deepEqual(Object.keys(urlConf).sort(), ['url', 'handler'].sort())
				var handler = expectedConfig[urlConf.url]
				if (handler !== false) assert.equal(urlConf.handler, handler, 'handler bad for domain \'' + urlConf.url + '\'')
				else assert.equal(typeof urlConf.handler, 'function', 'handler bad for:' + urlConf.url)
			})

			done()
		}

		function mockGetHandler(defaults, view) {
			return 'HANDLER'
		}
		function mockScan(opts) {
			cbOpts.push(opts)
			return viewStructure
		}
		function mockFileWriter(a, b, c, d, cb) {
			assert.deepEqual([a, b, c, d], expectedFw)
			cb()
		}
	},
}