// fragmentcache.js
// maintain a cache and directory of render functions
// © Harald Rudell 2012

exports.getCache = getCache

function getCache() {
	// key: 'fragmentName.domain', value: renderFunction or false
	var fragmentCache = {}
	// key: fragmentName, value: array of domain
	var fragmentNames = {}

	return {
		get: get,
		put: put,
		getMap: getMap,
		getList: getList,
	}

	/*
	get a value from the cache
	f: string: fragment name or 'fragmentName.domain'
	d: optional string domain name or undefined for any
	getDomain: optional boolean: if true, return domain rather than cache value

	getDomain
	return value:
	- undefined if fragment is unknown
	- getDomain:true: the domain for the fragment name
	- getDOmain:false: false if not yet cached, otherwise render function
	*/
	function get(fd) {
		var result

		if (!fd.fd) { // do not have exact key

			// try to find a domain
			var d
			var domains = fragmentNames[fd.f]
			if (domains) {
				fd.fd = fd.f + '.' + (fd.d && ~domains.indexOf(fd.d) ?
					fd.d : // the suggested domain did exist, use it
					fd.d = domains[0]) // otherwise use the first available domain
			}
		}

		if (fd.fd) result = fragmentCache[fd.fd]

		return result
	}

	/*
	put in cache
	fd: object with .f, .d, and .df initialized
	*/
	function put(fd, value) {
		fragmentCache[fd.fd] = value
		var domains = fragmentNames[fd.f]
		if (domains) {
			if (!~domains.indexOf(fd.d)) domains.push(fd.d)
		} else fragmentNames[fd.f] = [fd.d]
	}

	function getMap() {
		return fragmentNames
	}

	function getList() {
		return fragmentCache
	}
}