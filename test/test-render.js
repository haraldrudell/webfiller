// test-render.js
// nodeunit test for the webfiller rendering
// (c) Harald Rudell 2012

var compiler = require('../lib/compiler')
var render = require('../lib/renderengine')

module.exports = {
	testEmptyStringLocation: testEmptyStringLocation,
}

/*
Need to test:
top level data field
data data field
append
insert
append-all fields
html escaping
view include
array binding value
error
emty string location
*/

function testEmptyStringLocation(test) {
	var html = '<!doctype html><title/>'
	var bindings = {
		'': 'title',
	}
	var record = { title: 'Harald' }
	var viewExecutable = compiler.compileHtml5(html, bindings)
	console.log(viewExecutable.getSource())
	var actual = viewExecutable({})
	console.log(actual)

	test.done()
}

function testRender(test) {
	var options = {
		title: 'aTitle',
		data: {
			name: 'Harald',
		},
	}
	var viewExecutable = {

	}
	//var actual = render.render(data, viewExecutable)

	test.done()
}

