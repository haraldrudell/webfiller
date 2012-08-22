// test-renderer.js
// © Harald Rudell 2012

var compiler = require('../lib/compiler')
var render = require('../lib/renderer')
var assert = require('mochawrapper')

/*
Need to test:

type: bindings key
- empty string acesss: testEmptyStringLocation
- #id: testInsert
- .class: testAppend
- tag: testTag

type: bindings value string
- top level data field: testEmptyStringLocation, testReplace
- (data data field don't know how to implement this yes)
- -view include: TestInclude

type: bindings data object
- append: testAppend
- insert: testInsert
- append-all fields: testTag

type: bindings data array
- array binding value

type: other functions
- html escaping: testReplace
- raw escaping: TestInclude
- error: testError
*/

exports['Renderer:'] = {
	'Plain html': function () {
		var html = '<div/>'
		var expected = html
		var actual = compiler.compileHtml5(html)()
		assert.equal(actual, expected)
	},
}

exports['Render at Markup Locations:'] = {
	'Start of document': function () {
		var html = '<!doctype html><title/>'
		var bindings = {
			'': 'title',
		}
		var record = {title:'HERE'}
		var expected = 'HERE<!doctype html><title/>'
		var viewExecutable = compiler.compileHtml5(html, bindings)
	//console.log(viewExecutable.getSource('name'))
		var actual = viewExecutable(record)
	//console.log('actual:', actual)
		assert.equal(actual, expected)
	},
	'By id attribute': function () {
		var html = '<title id=x>y</title>'
		var bindings = {
			'#x': 'title',
		}
		var record = {title:'HERE'}
		var expected = '<title id=x>HEREy</title>'
		var viewExecutable = compiler.compileHtml5(html, bindings)
		var actual = viewExecutable(record)
		assert.equal(actual, expected)
	},
	'By class name': function () {
		var html = '<title class=x>y</title>'
		var bindings = {
			'.x': 'title',
		}
		var record = {title:'HERE'}
		var expected = '<title class=x>HEREy</title>'
		var viewExecutable = compiler.compileHtml5(html, bindings)
		var actual = viewExecutable(record)
		assert.equal(actual, expected)
	},
	'By tag name': function () {
		var html = 'a<title>b</title>c'
		var bindings = {
			title: 'title'
		}
		var record = {
			title: 'HERE',
		}
		var expected = 'a<title>HEREb</title>c'
		var viewExecutable = compiler.compileHtml5(html, bindings)
		var actual = viewExecutable(record)
		assert.equal(actual, expected)
	},
}

exports['Binding Constructs:'] = {
	'Array': function () {
		var html = 'a<title>b</title>c'
		var bindings = {
			title: [
				'here',
				'there'
			]
		}
		var record = {
			here: 'HERE',
			there: 'THERE',
		}
		var expected = 'a<title>HERETHEREb</title>c'
		var viewExecutable = compiler.compileHtml5(html, bindings)
		var actual = viewExecutable(record)
		assert.equal(actual, expected)
	},
	'Fragment include': function () {

		// the included view
		var fragmentName = 'FRAGMENT'
		var includeHtml = 'A<div>B</div>C'
		var includeBindings = {
			'div': 'there',
		}

		// the main view
		var html = 'a<title>b</title>c'
		var bindings = {
			'title': {
				'fragment': fragmentName,
			}
		}

		// the record
		var record = {
			here: 'HERE',
			there: 'THERE'
		}

		var lf = compiler.loadFragment
		compiler.loadFragment = mockInclude

		var expected = 'a<title>A<div>THEREB</div>Cb</title>c'
		var viewExecutable = compiler.compileHtml5(html, bindings)
		//console.log(viewExecutable.getSource('name'))
		var actual = viewExecutable(record)
		assert.equal(actual, expected)

		compiler.loadFragment = lf

		function mockInclude(fragment) {
			//console.log(arguments.callee.name, 'view&bindings', view, bindings)
			assert.equal(fragment, fragmentName)
			var renderFunction = compiler.compileHtml5(includeHtml, includeBindings)
			assert.ok(renderFunction instanceof Function)
			//console.log(arguments.callee.name, 'source', renderFunction.getSource('name'))
			//console.log(arguments.callee.name, 'result', renderFunction(record))
			return renderFunction
		}
	},
}

exports['Render Runtime:'] = {
	'Replace': function () {
		var html = 'a<title>b</title>c<div id=x>d'
		var bindings = {
			'#x': {
				replace: 'here'
			}
		}
		var record = {
			here: 'HERE',
		}
		var expected = 'a<title>b</title>c<div id=x>HERE'
		var viewExecutable = compiler.compileHtml5(html, bindings)
		var actual = viewExecutable(record)
		assert.equal(actual, expected)
	},
	'Append': function () {
		var html = 'a<div class=x>b</div>'
		var bindings = {
			'.x': { // find class x
				'append': 'here' // append to tags its initial content
			}
		}
		var record = {
			here: 'HERE', // the value for field 'here' is 'HERE'
		}
		var expected = 'a<div class=x>bHERE</div>'
		var viewExecutable = compiler.compileHtml5(html, bindings)
		//console.log(viewExecutable.getSource('name'))
		var actual = viewExecutable(record)
		assert.equal(actual, expected)
	},
	'Print': function () {
		var html = 'a<div>b</div>c'
		var bindings = {
			div: 'here'
		}
		var record = {
			here: '<&HERE', // the value for field 'here' is 'HERE'
		}
		var expected = 'a<div>&lt;&amp;HEREb</div>c'
		var viewExecutable = compiler.compileHtml5(html, bindings)
		var actual = viewExecutable(record)
		assert.equal(actual, expected)
	},
	'PrintRaw': function () {
		var html = 'a<div>b</div>c'
		var fragName = 'XYZ'
		var bindings = {
			div: {
				fragment: fragName
			}
		}
		var record = {}
		var expected = 'a<div><&b</div>c'
		var WF = require('../lib/runtime').WF
		WF.fragments[fragName] = function () { return '<&' }
		var viewExecutable = compiler.compileHtml5(html, bindings)
		var actual = viewExecutable(record)
		assert.equal(actual, expected)

		delete WF.fragments[fragName]
		assert.done()	
	},
	'Add Class': function () {
		var html = 'a<title class=1>b</title>'
		var bindings = {
			'title': {
				addClass: 'red blue'
			}
		}
		var expected = 'a<title class="1 red blue">b</title>'
		var viewExecutable = compiler.compileHtml5(html, bindings)
		var actual = viewExecutable()
		assert.equal(actual, expected)
	},
	'Remove Class': function () {
		var html = 'a<title class="1 red blue">b</title>'
		var bindings = {
			'title': {
				removeClass: 'red white'
			}
		}
		var expected = 'a<title class="1 blue">b</title>'
		var viewExecutable = compiler.compileHtml5(html, bindings)
		var actual = viewExecutable()
		assert.equal(actual, expected)
	},
	'Attribute, add, remove, replace': function () {
		var html = 'a<title a1=5 a2 = 3>b</title>'
		var bindings = {
			'title': {
				attribute: {
					'a1': false,
					'a3': 'hello',
					'a6': false,
				}
			}
		}
		var expected = 'a<title a2=3 a3=hello>b</title>'
		var viewExecutable = compiler.compileHtml5(html, bindings)
		var actual = viewExecutable()
		assert.equal(actual, expected)
	},
	'Suppress Tag': function () {
		var html = 'a<title class=1>b</title>'
		var funcName = 'myFunc'
		var bindings = {
			'title': {
				myFunc: false
			}
		}
		var WF = require('../lib/runtime').WF
		WF.functions[funcName] = function (params) {
			this.suppressTag()
		}
		var expected = 'ab</title>'
		var viewExecutable = compiler.compileHtml5(html, bindings)
		var actual = viewExecutable()
		assert.equal(actual, expected)
		delete WF.functions[funcName]
	},
}

exports['Render Problems:'] = {
	'Unknown Data Source Type': function () {
		var html = 'a<title>b'
		var bindings = {
			'title': 5, // we can't have number here
		}
		var record = {}
		var expected = 'a<title>Unknown rendering data source type:numberb'
		var viewExecutable = compiler.compileHtml5(html, bindings)
		var actual = viewExecutable(record)
		assert.equal(actual, expected)
	},
	'Fragment Name Not String': function () {
		var html = 'a<title>b'
		var bindings = {
			'title': {
				fragment: 5, // we can't have number here
			}
		}
		var record = {}
		var expected = 'a<title>Fragment name not stringb'
		var viewExecutable = compiler.compileHtml5(html, bindings)
		var actual = viewExecutable(record)
		assert.equal(actual, expected)
	},
	'Unknown Function': function () {
		var html = 'a<title>b'
		var bindings = {
			'title': {
				unknown: '',
			}
		}
		var record = {}
		var expected = 'a<title>Unknown rendering function:unknownb'
		var viewExecutable = compiler.compileHtml5(html, bindings)
		var actual = viewExecutable(record)
		assert.equal(actual, expected)
	},
}