// test-compiler.js
// nodeunit test for the webfiller html compiler
// (c) Harald Rudell 2012

var compiler = require('../lib/compiler')

module.exports = {
	testCompiler: testCompiler,
}

function testCompiler(test) {

	// test compilation
	var html = '<div>'
	var bindings = {
		'div': 'data'
	}
	var actual = compiler.compileHtml5(html, bindings)
	test.ok(actual instanceof Function)
	test.ok(actual.getSource instanceof Function)
	test.ok(actual.getIncludes instanceof Function)
	var renderFunction = actual

	// verify JavaScript source
	var expectedSource = 'WF.views["abc"]={"dataLinks":[{"linkage":"data","tag":{"tag":"div","index":1,"voidElement":false,"attributes":{},"classes":[]}}],"pieces":["","<div>","",""]};'
	var actualSource = actual.getSource('abc')
	test.equal(actualSource, expectedSource)

	// verify includes
	var expectedIncludes = []
	var actualIncludes = actual.getIncludes()
	test.deepEqual(actualIncludes, expectedIncludes)

	// render something
	var data = {data: 5}
	var expected = '<div>5'
	var actual = renderFunction(data)
	test.equal(actual, expected)

	test.done()
}