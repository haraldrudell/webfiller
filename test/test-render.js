// test-render.js
// nodeunit test for the webfiller rendering
// (c) Harald Rudell 2012

var compiler = require('../lib/compiler')
var render = require('../lib/renderer')

module.exports = {
	testEmptyStringLocation: testEmptyStringLocation,
	testReplace: testReplace,
	testInsert: testInsert,
	testAppend: testAppend,
	testTag: testTag,
	testInclude: testInclude,
	testError: testError,
}

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

function testEmptyStringLocation(test) {
	var html = '<!doctype html><title/>'
	var bindings = {
		'': 'title',
	}
	var record = { title: 'HERE' }
	var expected = 'HERE<!doctype html><title/>'
	var viewExecutable = compiler.compileHtml5(html, bindings)
	//console.log(viewExecutable.getSource('name'))
	var actual = viewExecutable(record)
	test.equal(actual, expected)

	test.done()
}

function testReplace(test) {
	var html = 'a<title>b</title>c'
	var bindings = {
		'title': 'here' // tags title, replace initial content with field here
	}
	var record = {
		here: 'HERE<&',
	}
	var expected = 'a<title>HERE&lt;&amp;</title>c'
	var viewExecutable = compiler.compileHtml5(html, bindings)
	var actual = viewExecutable(record)
	test.equal(actual, expected)

	test.done()
}


function testInsert(test) {
	var html = 'a<title>b</title>c<div id=x>d'
	var bindings = {
		'#x': {
			'insert': 'here'
		}
	}
	var record = {
		here: 'HERE',
	}
	var expected = 'a<title>b</title>c<div id=x>HEREd'
	var viewExecutable = compiler.compileHtml5(html, bindings)
	var actual = viewExecutable(record)
	test.equal(actual, expected)

	test.done()
}

function testAppend(test) {
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

function testTag(test) {
	var html = 'a<title>b</title>c'
	var bindings = {
		'title': {
			'append': ''// test append all fields
		}
	}
	var record = {
		here: 'HERE',
		there: 'THERE',
	}
	var expected = 'a<title>bhere:HERE, there:THERE</title>c'
	var viewExecutable = compiler.compileHtml5(html, bindings)
	var actual = viewExecutable(record)
	test.equal(actual, expected)

	test.done()
}

function testInclude(test) {

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

	var ri = compiler.renderInclude
	compiler.renderInclude = mockInclude

	var expected = 'a<title>A<div>THERE</div>C</title>c'
	var viewExecutable = compiler.compileHtml5(html, bindings)
	//console.log(viewExecutable.getSource('name'))
	var actual = viewExecutable(record)
	test.equal(actual, expected)

	compiler.renderInclude = ri
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

function testError(test) {
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