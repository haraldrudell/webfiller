// test-filewriter.js
// © Harald Rudell 2012

var filewriter = require('../lib/filewriter')
var assert = require('mochawrapper')
// http://nodejs.org/api/fs.html
var fs = require('fs')
// http://nodejs.org/api/path.html
var path = require('path')

var viewFolder = path.join(__dirname, 'testviews')

var viewStructure = {
	index: {
		css:[path.join(viewFolder, 'index', 'index.css')],
		js:[path.join(viewFolder, 'index', 'index_1.js'),
			path.join(viewFolder, 'index', 'index_2.js')],
		handler: {},
		fragmentFolder: path.join(viewFolder, 'index'),
		domain: 'index',
	},
	'': {
		css:[],
		js:[],
		handler: {},
		fragmentFolder: path.join(viewFolder, 'fragments'),
		domain: '',
	},
	home: {
		css: [path.join(viewFolder, 'home', 'home.css')],
		js: [],
		fragmentFolder: path.join(viewFolder, 'home'),
		domain: 'home',
	},
}
var ext = 'html'
var outputFolder = path.join(__dirname, 'tmp')

function clearFolder() {
		if (!fs.existsSync(outputFolder)) fs.mkdirSync(outputFolder)
}

exports['File Writer:'] = {
	'before': function (done) { // make sure outputFolder has no files
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
		filewriter.write(outputFolder, viewStructure, 'index', ext, checkResult)
		function checkResult(err) {
			if (err) assert.equal(err, undefined)
			assert.equal(fs.readdirSync(outputFolder).length, 2)
			done()
		}
	},
	'Per view files': function (done) {
		filewriter.write(outputFolder, viewStructure, undefined, ext, checkResult)
		function checkResult(err) {
			if (err) assert.equal(err, undefined)
			assert.equal(fs.readdirSync(outputFolder).length, Object.keys(viewStructure).length * 2)
			done()
		}
	},
}