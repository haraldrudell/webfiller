// test-filewriter.js
// © Harald Rudell 2012

var filewriter = require('../lib/filewriter')
var viewloader = require('../lib/viewloader')
var assert = require('mochawrapper')
// http://nodejs.org/api/fs.html
var fs = require('fs')
// http://nodejs.org/api/path.html
var path = require('path')

var testViews = path.join(__dirname, 'testviews')

var viewStructure = {
	index: {
		css:[path.join(testViews, 'index', 'index.css')],
		js:[path.join(testViews, 'index', 'index_1.js'),
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

var ext = 'html'
var outputFolder = path.join(__dirname, 'tmp')

exports['File Writer:'] = {
	'before': function (done) { // make sure outputFolder has no files
		if (!fs.existsSync(outputFolder)) fs.mkdirSync(outputFolder)
		var cbCount = 1
		var dirCount = 0
		var unlinkCounter
		fs.readdir(outputFolder, dirList)
		function dirList(err, list) {
			if (!err) {
				if (dirCount++ > 0) {
					if(list.length) end(Error('Can not clear:' + outputFolder))
					else end()
				} else {
					unlinkCounter = 1
					list.forEach(function (entry) {
						unlinkCounter++
						fs.unlink(path.join(outputFolder, entry), unlinkDone)
					})
					unlinkDone()
				}
			} else end(err)
		}
		function unlinkDone(err) {
			if (!err) {
				if (--unlinkCounter == 0) fs.readdir(outputFolder, dirList)
			} else end(err)
		}
		function end(err) {
			if (!err) {
				if (--cbCount == 0) done()
			} else throw Error(err)
		}
	},
	'Single file pair': function(done) {
		var expected = {
			'index.css': [
				'/* index.css */\n',
				'/* home.css */\n'
			],
			'index.js': [
				'// runtime.js\n',
				'// index_1.js\n',
				'// index_2.js\n',
				'// renderer.js\n',
				'// html5text.js\n',
			],
		}
		viewloader.setParameters(viewStructure, 'html')
		filewriter.write(outputFolder, viewStructure, 'index', ext, checkResult)
		function checkResult(err) {
			if (err) assert.equal(err.toString(), undefined, err instanceof Error ? err.stack : 'x')
			assert.deepEqual(fs.readdirSync(outputFolder).sort(), Object.keys(expected).sort())
			for (var file in expected) {
				var data = fs.readFileSync(path.join(outputFolder, file), 'utf-8')
				expected[file].forEach(function (string) {
					if (!~data.indexOf(string))
						assert.ok(false, 'Expected to contain:\'' + string + '\': \'' + file + ' in folder:' + outputFolder)
				})
			}

			done()
		}
	},
	'Per view files': function (done) {
		var expected = {
			".css": [],
			".js": [
				'// runtime.js\n',
				'// renderer.js\n',
				'// html5text.js\n',
			],
			"home.css": [
				'/* home.css */\n'
			],
			"home.js": [
				'// runtime.js\n',
				'// renderer.js\n',
				'// html5text.js\n',
			],
			"index.css": [
				'/* index.css */\n',
			],
			"index.js": [
				'// runtime.js\n',
				'// index_1.js\n',
				'// index_2.js\n',
				'// renderer.js\n',
				'// html5text.js\n',
			],
		}
		viewloader.setParameters(viewStructure, 'html')
		filewriter.write(outputFolder, viewStructure, undefined, ext, checkResult)
		function checkResult(err) {
			if (err) assert.equal(err.toString(), undefined, err instanceof Error ? err.stack : 'x')
			assert.deepEqual(fs.readdirSync(outputFolder).sort(), Object.keys(expected).sort())
			for (var file in expected) {
				var data = fs.readFileSync(path.join(outputFolder, file), 'utf-8')
				expected[file].forEach(function (string) {
					if (!~data.indexOf(string))
						assert.ok(false, 'Expected to contain:\'' + string + '\': \'' + file + ' in folder:' + outputFolder)
				})
			}

			done()
		}
	},
}