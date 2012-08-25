// test-renderer.js
// © Harald Rudell 2012

var compiler = require('../lib/compiler')
var renderer = require('../lib/renderer')
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
		var domain = 'DOMAIN'
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
		var expected = 'a<title>A<div>THEREB</div>Cb</title>c'

		// the record
		var record = {
			here: 'HERE',
			there: 'THERE'
		}

		var viewExecutable = compiler.compileHtml5(html, bindings, domain)

		var viewloader = require('../lib/viewloader')
		var _gf = viewloader.getFragment
		viewloader.getFragment = mockGetFragment
		var actual = viewExecutable(record)
		viewloader.getFragment = _gf

		assert.equal(actual, expected)

		function mockGetFragment(name, dom) {
			assert.equal(name, fragmentName)
			assert.equal(dom, domain)
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
				replace: ''
			}
		}
		var record = {
			here: 'HERE',
		}
		var expected = 'a<title>b</title>c<div id=x>here:HERE'
		var viewExecutable = compiler.compileHtml5(html, bindings)
		var actual = viewExecutable(record)
		assert.equal(actual, expected)
	},
	'Append': function () {
		var html = 'a<div class=x>b</div>'
		var bindings = {
			'.x': [ // find class x
				{
					'append': 'here', // append to tags its initial content
				},
				{
					'append': '',
				},
			],
		}
		var record = {
			here: 'HERE', // the value for field 'here' is 'HERE'
		}
		var expected = 'a<div class=x>bHEREhere:HERE</div>'
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
		// the fragment
		var fragName = 'XYZ'
		var includeHtml = '<&'
		var bindings = {
			div: {
				fragment: fragName
			}
		}

		// the main view
		var domain = 'DOMAIN'
		var html = 'a<div>b</div>c'
		var expected = 'a<div><&b</div>c'

		var record = {}

		var viewExecutable = compiler.compileHtml5(html, bindings, domain)

		var viewloader = require('../lib/viewloader')
		var _gf = viewloader.getFragment
		viewloader.getFragment = mockGetFragment
		var actual = viewExecutable(record)
		viewloader.getFragment = _gf

		assert.equal(actual, expected)

		function mockGetFragment(name, dom) {
			assert.equal(name, fragName)
			assert.equal(dom, domain)
			var renderFunction = compiler.compileHtml5(includeHtml, bindings)
			assert.ok(typeof renderFunction == 'function')
			return renderFunction
		}

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
	'Unknown Fragment': function () {
		var cbCounter
		var html = ''
		var fragmentName = 'FRAGMENT'
		var domain = 'DOMAIN'
		var bindings = {
			'': {
				fragment: fragmentName,
			}
		}

		var viewloader = require('../lib/viewloader')
		var _gf = viewloader.getFragment
		viewloader.getFragment = mockGetFragment

		var expected = 'Unknown fragment:' + fragmentName
		var renderFunction = compiler.compileHtml5(html, bindings, domain)
		cbCounter = 0
		var actual = renderFunction({})
		assert.equal(cbCounter, 1)
		assert.equal(actual, expected)

		var html = ''
		var fragmentName = 'FRAGMENT.SPECIFIC'
		var domain = 'DOMAIN'
		var bindings = {
			'': {
				fragment: fragmentName,
			}
		}
		var expected = 'Unknown fragment:' + fragmentName
		var renderFunction = compiler.compileHtml5(html, bindings, domain)
		cbCounter = 0
		var actual = renderFunction({})
		assert.equal(cbCounter, 1)
		assert.equal(actual, expected)

		viewloader.getFragment = _gf

		function mockGetFragment(name, dom) {
			cbCounter++
			assert.equal(name, fragmentName)
			assert.equal(dom, domain)
			return 'Unknown fragment:' + name
		}
	}
}

exports['Frontend Rendering:'] = {
	'Unknown view': function () {
		var expected = 'Unknown fragment:FRAGMENT'
		var actual = renderer.render({}, 'FRAGMENT')
		assert.equal(actual, expected)

		var expected = 'Unknown fragment:FRAGMENT.DOMAIN'
		var actual = renderer.render({}, 'FRAGMENT.DOMAIN', 'domain')
		assert.equal(actual, expected)
	},
	'Render': function () {
		var actual = renderer.render({}, 'fragment', 'domain')
	},
}