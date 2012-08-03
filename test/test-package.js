// packagetest.js
// test javascript and json syntax
// (c) Harald Rudell 2012
// 2012-08-02b

// http://nodejs.org/docs/latest/api/fs.html
var fs = require('fs')
// http://nodejs.org/api/path.html
var path = require('path')
// https://github.com/mishoo/UglifyJS/
var uglify = require('uglify-js')

if (!fs.exists) fs.exists = path.exists

module.exports = {
	syntaxTest: syntaxTest,
	parseGitignore: parseGitignore,
	findReadme: findReadme,
	verifyPackageJson: verifyPackageJson,
}

// this script should be put one level down from the deployment folder
var deployFolder = path.join(__dirname, '..')
packageJsonKeys = ['name', 'description', 'author', 'version', 'contributors', 'repository', 'devDependencies', 'dependencies', 'repository', 'main', 'scripts']
// these defaults can be overriden by a file ./test-package.json
var defaults = {
	// list of paths, relative to the deployFolder that will not be searched
	// you could have 'app.js', or 'public'
	ignore: [
		'test',
		'node_modules',
	],
	extensions: {
		'js': 'javascript',
		'json': 'json',
	}
}

var fileTypeMap = {
	'javascript': verifyJavaScriptSyntax,
	'json': verifyJsonSyntax,
}

// verify syntax of all JavaScript
function syntaxTest(test) {
	var cbCounter = 0

	// get possible custom settings from file
	var defaults = getDefaults()

	// look for syntax errors in all .js files
	var counts = {}
	var t = new Date
	scanFolder(deployFolder)

	function end(err) {

		if (err) throw err
		if (--cbCounter == 0) {
			// print file counts
			var s = []
			Object.keys(counts).forEach(function (countKey) {
				s.push(countKey + ':' + counts[countKey])
			})
			console.log('Files checked for syntax:', s.join(', '), 'in', (((new Date) - t) / 1e3).toFixed(1),'s')

			test.done()
		}
	}

	function scanFolder(folder) {
		//console.log(arguments.callee.name, folder)
		cbCounter++
		fs.readdir(folder, function (err, entries) {
			if (!err) {
				entries.forEach(function (entry) {

					// ignore hidden file (start with '.')
					if (entry.substring(0, 1) != '.') {
						var absolutePath = path.join(folder, entry)
						var relativePath = absolutePath.substring(deployFolder.length + 1)

						// check against ignore list
						if (defaults.ignore.indexOf(relativePath) == -1) {
							if (getType(absolutePath) === false) {

								// recursively scan folders
								scanFolder(absolutePath)
							} else {
								var entryExtension = path.extname(entry).substring(1)
								var fileTypeKey = defaults.extensions[entryExtension]
								if (fileTypeKey) {
									counts[fileTypeKey] = (counts[fileTypeKey] || 0) + 1
									var parseFunc = fileTypeMap[fileTypeKey]
									if (parseFunc) {

										// check syntax of json and JavaScript files
										cbCounter++
										parseFunc(absolutePath, relativePath, end)
									}
								}
							}
						}
					}
				})
			}
			end(err)
		})
	}
}

function verifyJavaScriptSyntax(file, relPath, cb) {
	fs.readFile(file, 'utf-8', function (err, javascript) {
		if (!err) {
			var jsp = uglify.parser
			var ast
			try {
				ast = jsp.parse(javascript)
			} catch (e) {
				console.log('File:', relPath ? relPath : file)
				console.log('Syntax issue: %s at line:%s column:%s position:%s',
					e.message,
					e.line,
					e.col,
					e.pos)
				throw e
			}
		}
		cb(err)
	})
}

function verifyJsonSyntax(file, relPath, cb) {
	fs.readFile(file, 'utf-8', function (err, jsonString) {
		if (!err) {
			var object
			try {
				object = JSON.parse(jsonString)
			} catch (e) {
				console.log('File:', relPath ? relPath : file)
				err = e
			}
		}
		cb(err)
	})	
}

function verifyPackageJson(test) {
	var jsonString = fs.readFileSync(path.join(deployFolder, 'package.json'), 'utf-8')
	var object
	try {
		object = JSON.parse(jsonString)
	} catch (e) {
		test.fail(e)
	}
	test.ok(!!object)
	packageJsonKeys.forEach(function (key) {
		test.ok(object[key] != undefined)
	})

	test.done()
}

// ensure that .gitignore contains '/node_modules'
function parseGitignore(test) {

	var expected = '/node_modules'
	var data = fs.readFileSync(path.join(deployFolder, '.gitignore'), 'utf-8')
	test.ok(data.indexOf(expected) != -1, '.gitignore missing:' + expected)

	test.done()
}

// ensure that readme.md exists
function findReadme(test) {

	test.ok(fs.existsSync(path.join(deployFolder, 'readme.md')))

	test.done()
}

// support stuff

// get configuration, optionally from './test-pagage.json'
function getDefaults() {

	// read the ignore file
	var testPackageJsonName = path.join(__dirname, path.basename(__filename, path.extname(__filename)) + '.json')
	if (getType(testPackageJsonName)) {
		var text = fs.readFileSync(testPackageJsonName, 'utf-8')
		var msg = 'Bad json in:' + testPackageJsonName
		try {
			var object = JSON.parse(text)
		} catch (e) {
			console.log(msg)
			throw e
		}
		if (!object) throw Error(msg)

		// apply settings from file
		if (object.ignore) {
			if (!Array.isArray(object.ignore)) Error(testPackageJsonName + ' ignore must be array')
			defaults.ignore = object.ignore
		}
		if (object.extensions) {
			if (typeof object.extensions != 'object') Error(testPackageJsonName + ' extension must be object')
			defaults.extension = object.extension
		}
	}

	return defaults
}

// determine what path1 is
// return value:
// undefined: does not exist
// false: is a directory
// true: is a file
function getType(path1) {
	var result
	var stats
	try {
		stats = fs.statSync(path1)
	} catch (e) {
		var bad = true
		if (e instanceof Error && e.code == 'ENOENT') bad = false
		if (bad) {
			console.log('Exception for:', typeof path1, path1, path1 && path1.length)
			throw e
		}
	}
	if (stats) {
		if (stats.isFile()) result = true
		if (stats.isDirectory()) result = false
	}
	return result
}