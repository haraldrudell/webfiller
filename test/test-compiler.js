// test-compiler.js
// © Harald Rudell 2012

var compiler = require('../lib/compiler')
var assert = require('mochawrapper')

exports['Compiler:'] = {
	'Empty html without failure': function () {
		var html = ''
		var actual = compiler.compileHtml5(html)
		assert.ok(actual instanceof Function)
		assert.ok(actual.getSource instanceof Function)
		assert.ok(actual.getIncludes instanceof Function)
		assert.equal(actual.getDomain(), undefined)

		// verify source
		var expectedSource = 'WF.fragments["abc"]={"dataLinks":[],"pieces":[""]};'
		var actualSource = actual.getSource('abc')
		assert.equal(actualSource, expectedSource)

		// verify includes
		var expectedIncludes = []
		var actualIncludes = actual.getIncludes()
		assert.deepEqual(actualIncludes, expectedIncludes)

		var expectedMarkup = ''
		var actualMarkup = actual()
		assert.equal(actualMarkup, expectedMarkup)
	},
	'Source and includes data': function () {

		// test compilation
		var html = '<!doctype><taga id=anid><tagb class=aclass><div>x</div><p>'
		var domain = 'DOMAIN'
		var bindings = {
			'-view': 'someothername',
			'': 'LOC0',
			'#anid': 'ANID',
			'.aclass': 'ACLASS',
			'div': [
				'field1',
				'field2',
				{
					fragment: 'FRAGMENT',
				},
			],
		}
		var renderFunction = compiler.compileHtml5(html, bindings, domain)
		assert.equal(typeof renderFunction, 'function')

		// verify JavaScript source
		var expectedSource = 'WF.fragments["abc"]={"domain":"DOMAIN","dataLinks":[' +
			'{"d":"LOC0","t":{}},' +
			'{"d":"ANID","t":{"t":"taga","i":1,"a":{"id":"anid"},"c":[]}},' +
			'{"d":"ACLASS","t":{"t":"tagb","i":4,"a":{},"c":["aclass"]}},' +
			'{"d":[' +
				'"field1","field2",' +
				'{"fragment":"FRAGMENT"}' +
				'],"t":{"t":"div","i":7,"a":{},"c":[]}}' +
			'],' +
			'"pieces":["<!doctype>","<taga id=anid>","","","<tagb class=aclass>","","","<div>","x","</div>","<p>","",""]};'
		var actualSource = renderFunction.getSource('abc')
		assert.equal(actualSource, expectedSource)
		assert.equal(renderFunction.getDomain(), domain)

		// verify includes
		var expectedIncludes = ['FRAGMENT']
		var actualIncludes = renderFunction.getIncludes()
		assert.deepEqual(actualIncludes, expectedIncludes)
	},
}