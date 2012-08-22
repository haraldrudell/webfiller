// test-html5text.js
// © Harald Rudell 2012

var html5text = require('../lib/html5text')
var assert = require('mochawrapper')

exports['Html5 Text Translation'] = {
	'Conversion from text to other types': function () {
		var functions = {
			textToNormal: {
				// input: expected
				'&<"\'>/= \t\n\f\r`': '&amp;&lt;"\'>/= \t\n\f\r`',
			},
			textToReplaceable: {
				'&<"\'>/= \t\n\f\r`</title&a': '&<"\'>/= \t\n\f\r`</ title& a',
			},
			textToAttributeName: {
				'&<"\'>/= \t\n\f\r`': '&amp;&lt;&quot;&apos;&gt;&sol;&equals;&#x20;&#x9;&#xa;&#xc;`',
			},
			textToUnquotedAttributeValue: {
				'&<"\'>/= \t\n\f\r`': '&&lt;&quot;&apos;&gt;/&equals;&#x20;&#x9;&#xa;&#xc;&grave;',
			},
			textToDoubleQuotedAttributeValue: {
				'&<"\'>/= \t\n\f\r`': '"&<&quot;\'>/= \t\n\f\r`"',
			},
		}
		for (var functionName in functions) {

			// verify that a function by this name exists
			var func = html5text[functionName]
			assert.ok(func instanceof Function)
			var tests = functions[functionName]
			for (var input in tests) {

				// verify the function's output value
				var expected = tests[input]
				var actual = func(input)
				assert.equal(actual, expected)
			}
		}
	},
}