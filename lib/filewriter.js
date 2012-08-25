// filewriter.js
// write web resources to the filesystem exposed to the frontend
// © Harald Rudell 2012

var fragmentcollector = require('./fragmentcollector')
// http://nodejs.org/api/fs.html
var fs = require('fs')
// http://nodejs.org/api/path.html
var path = require('path')

exports.write = write

function write(folder, viewStructure, baseName, ext, cb) {
	var ended
	var endCounter = 1

	try {

		// ensure an empty folder exists
		var dirCounter = 2
		if (!fs.existsSync(folder)) fs.mkdir(folder, dirEnd)
		else fs.readdir(folder, processEntries)
		function processEntries(err, entries) {
			if (!err) entries.forEach(function (entry) {
				dirCounter++
				fs.unlink(path.join(folder, entry), dirEnd)
			})
			dirEnd(err)
		}

		// get fragment JavaScript
		var js = fragmentcollector.collect(viewStructure, ext)
		dirEnd()

		function dirEnd(err) {
			if (!err) {
				if (--dirCounter == 0) writeFiles()
			} else end(err)
		}

		function writeFiles() {
			// write the files
			var css
			var js
			if (baseName) {
				css = createFile(baseName + '.css')
				js = createFile(baseName + '.js', true)
			}
			for (var domain in viewStructure) {
				var viewData = viewStructure[domain]
				if (!baseName) {
					if (css) css.close()
					css = createFile(domain + '.css')
					if (js) js.close()
					js = createFile(domain + '.js', true)
				}
				css.pushFileArray(viewData.css)
				js.pushFileArray(viewData.js)
			}
			if (css) css.close()
			if (js) js.close()
			end()
		}
	} catch (e) {
		end(e)
	}

	function end(error) {
		if (!error) {
			if (!ended && --endCounter == 0) {
				ended = true
				cb()
			}
		} else if (!ended) {
			ended = true
			cb(error)
		}
	}

	function createFile(name, isJs) {
		// array of string: filename or array: string data
		var writeQueue = []
		var leadOut = []
		var writing
		var pendingClose
		var isError
		var stream = fs.createWriteStream(path.join(folder, name), {encoding:'utf-8'})
		stream.on('error', fileError)
		endCounter++

		if (isJs) { // special lead-in and lead-out for JavaScript
			writeQueue.push(path.join(__dirname, 'runtime.js'))
			writeQueue.push([js])
			write()
			leadOut.push(path.join(__dirname, 'renderer.js'))
			leadOut.push(path.join(__dirname, 'html5text.js'))
		}

		stream.write('')

		return {
			pushFileArray: pushFileArray,
			push: push,
			close: close,
		}

		function write() {
			if (!isError) {
				writing = true
				nextWrite()
			}
		}

		function nextWrite() {
			var item
			if (item = writeQueue.shift()) writeItem(item)
			else if (pendingClose && (item = leadOut.shift())) writeItem(item)
			else {
				writing = false // end of data to write
				if (pendingClose) end() // file closed and all data written: end
			}
		}

		function writeItem(item) {
			if (Array.isArray(item)) {
				item.forEach(function (string) {
					stream.write(string)
					stream.write('\n')
				})
				nextWrite()
			} else {
				var readStream = fs.createReadStream(item, {encoding:'utf-8'})
				readStream.on('end', eof)
				readStream.on('error', fileError)
				readStream.pipe(stream, {end:false})
			}
		}

		function eof(err) {
			if (!err) stream.write('\n')
			nextWrite()
		}

		function fileError(err) {
			// err is an Error object
			isError = true
			end(err)
		}

		function pushFileArray(array) {
			writeQueue.push.apply(writeQueue, array)
			if (!writing) write()
		}
		function push(data) {
			writeQueue.push(data)
			if (!writing) write()
		}
		function close() {
			pendingClose = true
			if (!writing) write()
		}
	}
}