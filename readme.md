# Webfiller

Webfiller puts data into html5 web pages.

* Absolute standard **html5**
* Absolute standard **html5**
* Dual-side rendering in browser and on server

And...

* Shared code between server and browser, all JavaScript
* Integrates with express 2 and 3
* The parsing, view compiler and dual-side rendering features can be used stand-alone
* Supports any [w3c html5](http://dev.w3.org/html5/markup/syntax.html), including MathML and SVG
* Awesome

## Get It Now

* [Webfiller](https://github.com/haraldrudell/webfiller) is on github
* An [express 3 demo project](https://github.com/haraldrudell/express3webfiller) is available and live [here](http://e3.haraldrudell.com)
* An [express 2 demo project](https://github.com/haraldrudell/express2webfiller) is available and live [here](http://e2.haraldrudell.com)

# Concepts

## Views
Webfiller thinks of your html in terms of views:

* **Main views** have a url and are directly accessible by the browser
* **Fragments** are other html pieces that are rendered into a main view on the server or in the browser

## Bindings
Webfiller injects data into web pages. Because there are no template language, the locations where to put data is declared as bindings. 

* **Binding key** is a tring that declares the view location
 * **'.class'** are all elements that have this class
 * **'#id'** is the element with this id attribute
 * **'tag'** all tag elements
 * **''** the document location preceding the first tag
 * A **location** is an opening tag
 * A **tag** is not a comment, directive or unescaped text segment
 * An opening tag may be a void tag
* **Binding value** declares what to insert at the location

 * 'string' a key in the options.data or options object provided to the view
 * Array facilitates is multiple values being applied
 * '-view:index' insert the output from rendering a fragment
 * object: A number of custom rendering functions applied

## Compile to a View Executable

A view is compiled on server startup. Compiling takes the view and a bindings object to produce a view executable. The **view executable** can render both on the server and in the browser.

This is easy to use:

* In the browser: **WF.render**('view', data) produces a string of html
* on the server response.render('view', options) renders a view

## Custom functions

Webfiller facilitates dual-side JavaScript that is executed both on the server and in the browser. Webfiller provides a small set of basic functions, and custom functions can add or override those functions. The benefit is that the same custom code is neatly organized and available both in the browser and on the server at no extra effort.

## Folder Structure

Webfiller uses two folders: the view folder and the webfiller folder. The webfiller folder has files written to it that should be aviailable as Web resources for the browser. Typically this is one JavaScript and one css file copied from support files for each main view.

* The view folder contains each main view as an html file, eg. 'index.html'
* Each main view can have a **sibling folder** containing support files

All code, markup and styling pertaining to a main view is enclosed in the main view and its sibling folder. This has a benefit that it makes it really easy to copy a view to another project.

### Sibling folder

* if there is a JavaScript file in the sibling folder, by the same name as the main view, then two exports is used from this file:

 * getHandler export: a **handler function** that returns the handler function with arguments req, res, next
 * fragment export: which is a **fragment directory object** of all fragments that should be made available in the browser

* Any file ending with **_1.js** is browser JavaScript and will be made available in the webfiller folder
* Any file ending with **_2.js** is dual-side JavaScript and will be made available in the webfiller folder
* Any file ending with **.css** is styling and will be made available in the webfiller folder

### Example File Collection

* view - the root view folder

 * index.html - a main view for the site's root url
 * index - a sibling folder

    * index_1.js front end JavaScript pertaining to the index view
    * index.js the server-side handler function for the index view
    * index.css styling for the index view
    * index_2.js dual side JavaScript for the index view
    * list.html the view 'index/list'
    * tree.html the view 'index/tree'

 * otherview.html - the view '/otherview'
 * otherview - a sibling folder

# Reference

TODO examples

# Notes

(c) [Harald Rudell](http://www.haraldrudell.com) wrote this for node in August, 2012

No warranty expressed or implied. Use at your own risk.

Please suggest better ways, new features, and possible difficulties on [github](https://github.com/haraldrudell/webfiller)