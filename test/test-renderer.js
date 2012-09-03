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

// mocking of getFragment
var fragmentloader = require('../lib/fragmentloader')
var _gf

exports['Renderer:'] = {
	'Ability to render plain html': function () {
		var html = '<div/>'
		var expected = html
		var actual = compiler.compileHtml5(html)()
		assert.equal(actual, expected)
	},
}

exports['Renderer Ability to Insert Field at Markup Locations:'] = {
	'Start of document': function () {
		var html = '<!doctype html><title/>'
		var bindings = {'': 'title'}
		var record = {title:'HERE'}
		var expected = 'HERE<!doctype html><title/>'
		var viewExecutable = compiler.compileHtml5(html, bindings)
		var actual = viewExecutable(record)
		assert.equal(actual, expected)
	},
	'By id attribute': function () {
		var html = '<title id=x>y</title>'
		var bindings = {'#x': 'title'}
		var record = {title:'HERE'}
		var expected = '<title id=x>HEREy</title>'
		var viewExecutable = compiler.compileHtml5(html, bindings)
		var actual = viewExecutable(record)
		assert.equal(actual, expected)
	},
	'By class name': function () {
		var html = '<title class=x>y</title>'
		var bindings = {'.x': 'title'}
		var record = {title:'HERE'}
		var expected = '<title class=x>HEREy</title>'
		var viewExecutable = compiler.compileHtml5(html, bindings)
		var actual = viewExecutable(record)
		assert.equal(actual, expected)
	},
	'By tag name': function () {
		var html = 'a<title>b</title>c'
		var bindings = {title: 'title'}
		var record = {title: 'HERE'}
		var expected = 'a<title>HEREb</title>c'
		var viewExecutable = compiler.compileHtml5(html, bindings)
		var actual = viewExecutable(record)
		assert.equal(actual, expected)
	},
}

exports['Bindings String Field:'] = {
	'First Field': function () {
		var html = '<!doctype html><title/>'
		var bindings = {'': 'a1'}
		var record = {a1:'HERE', a2: 'THERE'}
		var expected = 'HERE<!doctype html><title/>'
		var viewExecutable = compiler.compileHtml5(html, bindings)
		var actual = viewExecutable(record)
		assert.equal(actual, expected)
	},
	'Second Field': function () {
		var html = '<!doctype html><title/>'
		var bindings = {'': 'a2'}
		var record = {a1:'HERE', a2: 'THERE'}
		var expected = 'THERE<!doctype html><title/>'
		var viewExecutable = compiler.compileHtml5(html, bindings)
		var actual = viewExecutable(record)
		assert.equal(actual, expected)
	},
	'All Fields': function () {
		var html = '<!doctype html><title/>'
		var bindings = {'': ''}
		var record = {a1:'HERE', a2: 'THERE'}
		var expected = 'a1: HERE, a2: THERE<!doctype html><title/>'
		var viewExecutable = compiler.compileHtml5(html, bindings)
		var actual = viewExecutable(record)
		assert.equal(actual, expected)
	},
}

exports['Binding Array Type:'] = {
	'Empty Array': function () {
		var html = 'a<title>b</title>c'
		var bindings = {title: []}
		var record = {
			here: 'HERE',
			there: 'THERE',
		}
		var expected = 'a<title>b</title>c'
		var viewExecutable = compiler.compileHtml5(html, bindings)
		var actual = viewExecutable(record)
		assert.equal(actual, expected)
	},
	'Single String Constant': function () {
		var html = 'a<title>b</title>c'
		var bindings = {title: ['here']}
		var record = {
			here: 'HERE',
			there: 'THERE',
		}
		var expected = 'a<title>hereb</title>c'
		var viewExecutable = compiler.compileHtml5(html, bindings)
		var actual = viewExecutable(record)
		assert.equal(actual, expected)
	},
	'Multiple String Constants': function () {
		var html = 'a<title>b</title>c'
		var bindings = {title: ['here', 'there']}
		var record = {
			here: 'HERE',
			there: 'THERE',
		}
		var expected = 'a<title>herethereb</title>c'
		var viewExecutable = compiler.compileHtml5(html, bindings)
		var actual = viewExecutable(record)
		assert.equal(actual, expected)
	},
}

exports['Render Custom Functions:'] = {
	'NoContent': function () {
		var html = 'a<title>b</title>c<div id=x>d'
		var bindings = {
			'#x': {
				noContent: []
			}
		}
		var record = {
			here: 'HERE',
		}
		var expected = 'a<title>b</title>c<div id=x>'
		var viewExecutable = compiler.compileHtml5(html, bindings)
		var actual = viewExecutable(record)
		assert.equal(actual, expected)
	},
	'NoContent with Bindings Content': function () {
		var html = 'a<title>b</title>c<div id=x>d'
		var bindings = {
			'#x': {
				noContent: 'here'
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
	'Single append': function () {
		var html = 'a<div class=x>b</div>'
		var bindings = {'.x': {'append': 'here'}}
		var record = {
			here: 'HERE', // the value for field 'here' is 'HERE'
		}
		var expected = 'a<div class=x>bHERE</div>'
		var viewExecutable = compiler.compileHtml5(html, bindings)
		var actual = viewExecutable(record)
		assert.equal(actual, expected)
	},
	'Multiple append': function () {
		var html = 'a<div class=x>b</div>'
		var bindings = {
			'.x': [{
				'append': 'here', // append to tags its initial content
			},{
				'append': '',
			}],
		}
		var record = {
			here: 'HERE', // the value for field 'here' is 'HERE'
		}
		var expected = 'a<div class=x>bHEREhere: HERE</div>'
		var viewExecutable = compiler.compileHtml5(html, bindings)
		var actual = viewExecutable(record)
		assert.equal(actual, expected)
	},
	'Escaping of Content': function () {
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
	'Raw': function () {
		var html = 'a<div>b</div>c'
		var bindings = {
			div: {
				raw: 'here',
			},
		}
		var record = {
			here: '<&HERE', // the value for field 'here' is 'HERE'
		}
		var expected = 'a<div><&HEREb</div>c'
		var viewExecutable = compiler.compileHtml5(html, bindings)
		var actual = viewExecutable(record)
		assert.equal(actual, expected)
	},
	'Add Class': function () {
		var html = 'a<title class=1>b</title>'
		var bindings = {
			'title': {
				addClass: ['red blue']
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
				removeClass: ['red white']
			}
		}
		var expected = 'a<title class="1 blue">b</title>'
		var viewExecutable = compiler.compileHtml5(html, bindings)
		var actual = viewExecutable()
		assert.equal(actual, expected)
	},
	'Single Class': function () {
		var html = 'a<title class="yellow red">b</title>'
		var bindings = {
			'title': {
				removeClass: ['red']
			}
		}
		var expected = 'a<title class=yellow>b</title>'
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
					'a3': ['hello'],
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

exports['Fragment Rendering:'] = {
	'before': function() {
		_gf = fragmentloader.getFragment
	},
	'after': function () {
		fragmentloader.getFragment = _gf
	},
	'Unknown any-domain fragment': function () {
		var cbCounter = 0
		var names = []
		var doms = []
		var html = ''
		var fragmentName = 'FRAGMENT'
		var domain = 'DOMAIN'
		var bindings = {
			'': {
				fragment: [fragmentName],
			}
		}
		var expected = 'Unknown fragment:' + fragmentName
		var expectedNames = [fragmentName]
		var expectedDoms = [domain]

		fragmentloader.getFragment = mockGetFragment

		var renderFunction = compiler.compileHtml5(html, bindings, domain)
		var actual = renderFunction({})
		assert.equal(actual, expected)
		assert.equal(cbCounter, 1)
		assert.deepEqual(names, expectedNames)
		assert.deepEqual(doms, expectedDoms)

		function mockGetFragment(name, dom) {
			cbCounter++
			names.push(name)
			doms.push(dom)
			return 'Unknown fragment:' + name
		}
	},
	'Unknown specific-domain fragment': function () {
		var cbCounter = 0
		var names = []
		var doms = []
		var html = ''
		var fragmentName = 'FRAGMENT.SPECIFIC'
		var domain = 'DOMAIN'
		var bindings = {
			'': {
				fragment: [fragmentName],
			}
		}
		var expected = 'Unknown fragment:' + fragmentName
		var expectedNames = [fragmentName]
		var expectedDoms = [domain]

		fragmentloader.getFragment = mockGetFragment

		var renderFunction = compiler.compileHtml5(html, bindings, domain)
		var actual = renderFunction({})
		assert.equal(actual, expected)
		assert.equal(cbCounter, 1)
		assert.deepEqual(names, expectedNames)
		assert.deepEqual(doms, expectedDoms)

		function mockGetFragment(name, dom) {
			cbCounter++
			names.push(name)
			doms.push(dom)
			return 'Unknown fragment:' + name
		}
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
				'fragment': [fragmentName],
			}
		}
		var expected = 'a<title>A<div>THEREB</div>Cb</title>c'

		// the record
		var record = {
			here: 'HERE',
			there: 'THERE'
		}

		var viewExecutable = compiler.compileHtml5(html, bindings, domain)

		fragmentloader.getFragment = mockGetFragment
		var actual = viewExecutable(record)

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