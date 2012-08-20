// test-renderer.js
// © Harald Rudell 2012

var compiler = require('../lib/compiler')
var render = require('../lib/renderer')

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

exports.plainHtml = function plainHtml(test) {
	var html = '<div/>'
	var expected = html
	var actual = compiler.compileHtml5(html)()
	test.equal(actual, expected)

	test.done()
}

exports.emptyStringLocation = function (test) {
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
	test.equal(actual, expected)

	test.done()
}

exports.idLocation = function (test) {
	var html = '<title id=x>y</title>'
	var bindings = {
		'#x': 'title',
	}
	var record = {title:'HERE'}
	var expected = '<title id=x>HEREy</title>'
	var viewExecutable = compiler.compileHtml5(html, bindings)
	var actual = viewExecutable(record)
	test.equal(actual, expected)

	test.done()
}

exports.classLocation = function (test) {
	var html = '<title class=x>y</title>'
	var bindings = {
		'.x': 'title',
	}
	var record = {title:'HERE'}
	var expected = '<title class=x>HEREy</title>'
	var viewExecutable = compiler.compileHtml5(html, bindings)
	var actual = viewExecutable(record)
	test.equal(actual, expected)

	test.done()
}

exports.tagLocation = function (test) {
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
	test.equal(actual, expected)

	test.done()
}

exports.testArray = function (test) {
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
	test.equal(actual, expected)

	test.done()
}

exports.testFragment = function (test) {

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
	test.equal(actual, expected)

	compiler.loadFragment = lf
	test.done()	

	function mockInclude(fragment) {
		//console.log(arguments.callee.name, 'view&bindings', view, bindings)
		test.equal(fragment, fragmentName)
		var renderFunction = compiler.compileHtml5(includeHtml, includeBindings)
		test.ok(renderFunction instanceof Function)
		//console.log(arguments.callee.name, 'source', renderFunction.getSource('name'))
		//console.log(arguments.callee.name, 'result', renderFunction(record))
		return renderFunction
	}
}

exports.testReplace = function (test) {
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
	test.equal(actual, expected)

	test.done()
}

exports.testAppend = function (test) {
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
	test.equal(actual, expected)

	test.done()
}

exports.testPrint = function (test) {
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
	test.equal(actual, expected)

	test.done()	
}

exports.testPrintRaw = function (test) {
	var html = 'a<div>b</div>c'
	var fragName = 'XYZ'
	var bindings = {
		div: {
			fragment: fragName
		}
	}
	var record = {}
	var expected = 'a<div><&b</div>c'
	WF = require('../lib/runtime').WF
	WF.fragments[fragName] = function () { return '<&' }
	var viewExecutable = compiler.compileHtml5(html, bindings)
	var actual = viewExecutable(record)
	test.equal(actual, expected)

	delete WF.fragments[fragName]
	test.done()	
}

exports.testUnknownDataSourceType = function (test) {
	var html = 'a<title>b'
	var bindings = {
		'title': 5, // we can't have number here
	}
	var record = {}
	var expected = 'a<title>Unknown rendering data source type:numberb'
	var viewExecutable = compiler.compileHtml5(html, bindings)
	var actual = viewExecutable(record)
	test.equal(actual, expected)

	test.done()	
}

exports.testFragmentNameNotString = function (test) {
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
	test.equal(actual, expected)

	test.done()	
}

exports.testUnknownFunction = function (test) {
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
	test.equal(actual, expected)

	test.done()	
}

exports.testAddClass = function (test) {
	var html = 'a<title class=1>b</title>'
	var bindings = {
		'title': {
			addClass: 'red blue'
		}
	}
	var expected = 'a<title class="1 red blue">b</title>'
	var viewExecutable = compiler.compileHtml5(html, bindings)
	var actual = viewExecutable()
	test.equal(actual, expected)

	test.done()	
}

exports.testRemoveClass = function (test) {
	var html = 'a<title class="1 red blue">b</title>'
	var bindings = {
		'title': {
			removeClass: 'red white'
		}
	}
	var expected = 'a<title class="1 blue">b</title>'
	var viewExecutable = compiler.compileHtml5(html, bindings)
	var actual = viewExecutable()
	test.equal(actual, expected)

	test.done()	
}

exports.testAttribute = function (test) {
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
	test.equal(actual, expected)

	test.done()	
}

exports.testSuppressTag = function (test) {
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
	test.equal(actual, expected)
	delete WF.functions[funcName]

	test.done()	
}