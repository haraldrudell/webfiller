// html5text.js
// convert between types of html5 character data
// (c) Harald Rudell 2012

// http://dev.w3.org/html5/markup/
// http://dev.w3.org/html5/spec/named-character-references.html
// http://dev.w3.org/html5/markup/syntax.html#hex-charref

// html5 text:
// http://dev.w3.org/html5/markup/syntax.html#syntax-text
// text does not contain:
// control characters other than html5 space characters
// permanently undefined unicode characters

module.exports = {
	textToNormal: textToNormal,
	textToReplaceable: textToReplaceable,
	textToAttributeName: textToAttributeName,
	textToUnquotedAttributeValue: textToUnquotedAttributeValue,
	textToDoubleQuotedAttributeValue: textToDoubleQuotedAttributeValue,
}

// escape text for use as normal character data
// http://dev.w3.org/html5/markup/syntax.html#normal-character-data
// &amp; &lt;
function textToNormal(str) {
	return String(str)
		.replace(/&/g, '&amp;')
		.replace(/</g, '&lt;')
}

// escape text for use in title and textarea elements
// http://dev.w3.org/html5/markup/syntax.html#replaceable-character-data
// ambiguous ampersands we don't care about
// make sure we do not have any closing tags
// insert a space if a closing tag is found
function textToReplaceable(str, tag) {

	// insert space after ambiguous ampersands
	var result = String(str).replace(/&./gm, function(match) {
		if (match.length == 2) {
			if (' <&'.indexOf(match[1]) == -1) {
				match = '& ' + match[1]
			}
		}
		return match
	})

	// insert space to avoid text that contains a closing tag
	// this function applies to title and textarea elements
	if (!tag) tag = 'title'
	var regExp = new RegExp('<\/' + tag, 'gim')

	return result.replace(regExp, function(match) {
			return match.substring(0, 2) + ' ' + match.substring(2)
		})
}

// escape text for use as attribute name
// http://dev.w3.org/html5/markup/syntax.html#attribute-name
// note that an empty string is an illegal value
// &quot; &apos; &gt; &sol; &equals;
// space characters: space \t\n\f\r
function textToAttributeName(str) {
	return textToNormal(str)
		.replace(/"/, '&quot;')
		.replace(/'/, '&apos;')
		.replace(/>/, '&gt;')
		.replace(/\//, '&sol;')
		.replace(/=/, '&equals;')
		.replace(/ /, '&#x20;')
		.replace(/\t/, '&#x9;')
		.replace(/\n/, '&#xa;')
		.replace(/\f/, '&#xc;')
		.replace(/\r/, '')
}

// escape text for use as unquoted attribute value
// http://dev.w3.org/html5/markup/syntax.html#attr-value-unquoted
// note: empty string is an illegal value
// &acute; &apos; &quot; &gt;
function textToUnquotedAttributeValue(str) {
	return String(str)
		.replace(/"/, '&quot;')
		.replace(/'/, '&apos;')
		.replace(/=/, '&equals;')
		.replace(/>/, '&gt;')
		.replace(/</g, '&lt;')
		.replace(/ /, '&#x20;')
		.replace(/\t/, '&#x9;')
		.replace(/\n/, '&#xa;')
		.replace(/\f/, '&#xc;')
		.replace(/\r/, '')
		.replace(/`/, '&grave;')
}

// escape text for use as unquoted attribute value
function textToDoubleQuotedAttributeValue(str) {
	return '"' +
		String(str).replace(/"/, '&quot;')
		+ '"'
}