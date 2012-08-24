// filewriter.js
// write web resources to the filesystem exposed to the frontend
// © Harald Rudell 2012

var fragger = require('./fragger')

exports.write = write

function write(folder, viewStructure, baseName, cb) {
	if (!fs.exists(folder)) fs.mkdir(folder)
	var js = fragger.frag(viewStructure)
	if (typeof baseName == 'string') {
		// write to a single file pair
	} else {
		// write to per-view files
	}

}

function garbage() {
	// create index.css and index.js
	var fds = {}
	if (!fs.exists(opts.webFillerFolder)) fs.mkdir(opts.webFillerFolder)
	var publicFile = defaults.publicFile || defaultViewName
	if (publicFile !== true) {
		startNewPublicPair(publicFile)

		// the browser first need runtime to define the WF object
		// placing the runtime first allows its function to be overridden
		append(path.join(__dirname, 'runtime.js'), fds.js)
	}

	// object to dedupe render functions
	var renderFunctions = {}
	var WF = require('./runtime').WF

	// iterate over each view
	var cbCounter = 1
	views.forEach(function (view) {
		cbCounter++
		configureView(view)
	})
	viewComplete()

	// do the final callback
	function viewComplete(err) {
		if (--cbCounter == 0) {

			findUnknownFragments()

			// finally, the browser needs the render function
			append(path.join(__dirname, 'renderer.js'), fds.js)
			append(path.join(__dirname, 'html5text.js'), fds.js)

			fs.closeSync(fds.css.fd)
			fs.closeSync(fds.js.fd)
			if (callback) callback(err, result)
			else if (err) throw err
		}
	}

	// process a view, like 'index'
	function configureView(view) {

		if (publicFile === true) {
			startNewPublicPair(view)
			append(path.join(__dirname, 'runtime.js'), fds.js)
		}

		// assume the default view handler
		var getHandler = viewhandler.getHandler

		// see if there is a sibling folder by the same name as the view
		var viewSubfolder = path.join(opts.viewFolder, view)
		if (fs.existsSync(viewSubfolder)) {

			// check if a handler js file exists (viewfolder)/index/index.js
			var viewHandlerFile = path.join(viewSubfolder, view + '.js')
			if (fs.existsSync(viewHandlerFile)) {
				// get the custom handler for the route
				var handlerModule = require(viewHandlerFile)
				if (handlerModule.getHandler) getHandler = handlerModule.getHandler

				var serverFragments = handlerModule.fragments
				var publicFragments = handlerModule.publicFragments
				// forward any fragments to the frontend
				for (var fragmentName in publicFragments) {
					cbCounter++
					var absolute = path.join(viewSubfolder, fragmentName + '.' + opts.defExt)
					writeFragment(absolute, fragmentName, publicFragments[fragmentName])
				}

				// build server fragment directory
				var allFragments = {}
				for (var p in publicFragments) allFragments[p] = publicFragments[p]
				for (var p in serverFragments) allFragments[p] = serverFragments[p]
				for (var fragmentName in allFragments) {
					var absolute = path.join(viewSubfolder, fragmentName + '.' + opts.defExt)
					viewloader.addNewFragment(fragmentName, absolute, allFragments[fragmentName])
				}
			}

			// check for css and JavaScript in the sibling folder, forward to frontend
			fs.readdirSync(viewSubfolder).forEach(function (entry) {
				var absolute = path.join(viewSubfolder, entry)

				// append css and js files to the public folder
				if (entry.slice(-4) == '.css') append(absolute, fds.css)
				else if (entry.slice(-5) == '_1.js' || entry.slice(-5) == '_2.js') {
					append(absolute, fds.js)
					if (entry.slice(-5) == '_2.js') require(absolute)
				}
			})
		}

		// if there is defaults.view.index, use that as settings for the view
		// otherwise viewconfigurations.index
		// otherwise nothing
		var viewConfiguration = defaults.view && defaults.view[view] ||
			viewConfigurations[view] || {}

		result.push({
			url: viewConfiguration.url != null ? viewConfiguration.url : view,
			handler: getHandler(defaults, view)
		})

		viewComplete()
	}

	// write each defined fragment as JavaScript source for the front end
	// fragment: .view, .bindings
	// fragmentName: string: name of the frontend function
	function writeFragment(absolute, fragmentName, bindings) {
		if (!WF.fragments[fragmentName]) {
			viewloader.loadView(absolute, bindings, function (err, renderFunction) {
				if (!err) {

					// write as frontend JavaScript
					appendBuf(renderFunction.getSource(fragmentName), fds.js)

					// save to backend cache
					WF.fragments[fragmentName] = renderFunction
				}
				if (err) console.log(arguments.callee.name, err, Error().stack)
				viewComplete(err)
			})
		}
	}

	function findUnknownFragments() {
		// TODO nimp
	}

	function startNewPublicPair(view) {
		if (fds.css) fs.closeSync(fds.css.fd)
		if (fds.js) fs.closeSync(fds.js.fd)
		fds.css = {
			wrote: false,
			fd: fs.openSync(path.join(opts.webFillerFolder, view + '.css'), 'w')
		}
		fds.js = {
			wrote: false,
			fd: fs.openSync(path.join(opts.webFillerFolder, view + '.js'), 'w')
		}
	}

}

function append(file1, fdx) {
	var buf = fs.readFileSync(file1)
	appendBuf(buf, fdx)
}

function appendBuf(buf, fdx) {
	if (fdx.wrote) {
		fs.writeSync(fdx.fd, '\n')
	}
	if (typeof buf == 'string') fs.writeSync(fdx.fd, buf)
	else fs.writeSync(fdx.fd, buf, 0, buf.length)
	if (buf.length) fdx.wrote = true	
}