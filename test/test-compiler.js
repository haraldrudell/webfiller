// test-compiler.js
// © Harald Rudell 2012

var compiler = require('../lib/compiler')

exports.testEmptyHtml = function testEmptyHtml(test) {
	var html = ''
	var actual = compiler.compileHtml5(html)
	test.ok(actual instanceof Function)
	test.ok(actual.getSource instanceof Function)
	test.ok(actual.getIncludes instanceof Function)

	// verify source
	var expectedSource = 'WF.fragments["abc"]={"dataLinks":[],"pieces":[""]};'
	var actualSource = actual.getSource('abc')
	test.equal(actualSource, expectedSource)

	// verify includes
	var expectedIncludes = []
	var actualIncludes = actual.getIncludes()
	test.deepEqual(actualIncludes, expectedIncludes)

	var expectedMarkup = ''
	var actualMarkup = actual()
	test.equal(actualMarkup, expectedMarkup)

	test.done()
}

exports.testCompiler = function testCompiler(test) {

	// test compilation
	var html = '<!doctype><taga id=anid><tagb class=aclass><div>x</div><p>'
	var bindings = {
		'': 'LOC0',
		'#anid': 'ANID',
		'.aclass': 'ACLASS',
		'div': {
			fragment: 'FRAGMENT',
		},
	}
	var renderFunction = compiler.compileHtml5(html, bindings)
	test.equal(typeof renderFunction, 'function')

	// verify JavaScript source
	var expectedSource = 'WF.fragments["abc"]={"dataLinks":[' +
		'{"d":"LOC0","t":{}},' +
		'{"d":"ANID","t":{"t":"taga","i":1,"a":{"id":"anid"},"c":[]}},' +
		'{"d":"ACLASS","t":{"t":"tagb","i":4,"a":{},"c":["aclass"]}},' +
		'{"d":{"fragment":"FRAGMENT"},"t":{"t":"div","i":7,"a":{},"c":[]}}' +
		'],' +
		'"pieces":["<!doctype>","<taga id=anid>","","","<tagb class=aclass>","","","<div>","x","</div>","<p>","",""]};'
	var actualSource = renderFunction.getSource('abc')
	test.equal(actualSource, expectedSource)

	// verify includes
	var expectedIncludes = ['FRAGMENT']
	var actualIncludes = renderFunction.getIncludes()
	test.deepEqual(actualIncludes, expectedIncludes)

	test.done()
}