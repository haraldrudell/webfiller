// test-filewriter.js
// © Harald Rudell 2012

var filewriter = require('../lib/filewriter')
var fragmentloader = require('../lib/fragmentloader')
// https://github.com/haraldrudell/mochawrapper
var assert = require('mochawrapper')
// http://nodejs.org/api/fs.html
var fs = require('fs')
// http://nodejs.org/api/path.html
var path = require('path')

if (!fs.existsSync) fs.existsSync = path.existsSync

var testViews = path.join(__dirname, 'testviews')

var viewStructure = {
	index: {
		css:[path.join(testViews, 'index', 'index.css')],
		js:[path.join(testViews, 'index', '_1', 'indexfrontend.js'),
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
		var unlinkCounter
		var doCheck

		fs.exists(outputFolder, existsResult)

		function existsResult(exists) {
			if (exists) { // the folder exists, make sure it's empty
				fs.readdir(outputFolder, dirList)
			} else fs.mkdir(outputFolder, end)
		}

		function dirList(err, list) {
			if (!err) {
				unlinkCounter = 1
				if (doCheck = list.length) {
					list.forEach(function (entry) {
						unlinkCounter++
						fs.unlink(path.join(outputFolder, entry), unlinkDone)
					})					
				}
				unlinkDone()
			} else end(err)
		}

		function unlinkDone(err) {
			if (!err) {
				if (!--unlinkCounter) {
					if (doCheck) fs.readdir(outputFolder, verifyEmpty)
					else end()
				}
			} else end(err)
		}

		function verifyEmpty(err, list) {
			if (!err && list.length) err = Error('Could not empty folder: \'' + outputFolder + '\'')
			end(err)
		}

		function end(err) {
			if (!err) done()
			else throw err
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
		fragmentloader.setParameters(viewStructure, 'html')
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
		fragmentloader.setParameters(viewStructure, 'html')
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