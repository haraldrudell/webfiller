// test-fragmentcache.js
// © Harald Rudell 2012

var fragmentcache = require('../lib/fragmentcache')
// https://github.com/haraldrudell/mochawrapper
var assert = require('mochawrapper')

var fragName = 'a'
var domain1 = 'b'
var domain2 = 'c'
var domain3 = 'x'

var first = {
	fd: {
		fd: fragName + '.' + domain1,
		f: fragName,
		d:domain1
	},
	value: 1,
}
var second = {
	fd: {
		fd: fragName + '.' + domain2,
		f: fragName,
		d:domain2
	},
	value: 2,
}
var expectedMap = {}
expectedMap[fragName] = [domain1, domain2]

var aAny = {f:fragName}
var aMaybeC = {f:fragName, d:domain2}
var aMaybeX = {f:fragName, d:domain3}
var fragmentDirectory

exports.before = function () {
	fragmentDirectory = fragmentcache.getCache()
	fragmentDirectory.put(first.fd, first.value)
	fragmentDirectory.put(second.fd, second.value)
}

exports['FragmentCache:'] = {
	'Map': function () {
		var actual = fragmentDirectory.getMap()
		assert.deepEqual(actual, expectedMap)
	},
	'Any domain': function () {
		var actual = fragmentDirectory.get(aAny)
		assert.equal(actual, first.value)
	},
	'Exact Key': function () {
		var actual = fragmentDirectory.get(second.fd)
		assert.equal(actual, second.value)
	},
	'Suggested domain exists': function () {
		var actual = fragmentDirectory.get(aMaybeC)
		assert.equal(actual, second.value)
	},
	'Suggested domain missing': function () {
		var actual = fragmentDirectory.get(aMaybeX)
		assert.equal(actual, first.value)
	},
}