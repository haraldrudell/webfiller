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
Webfiller injects data into web pages. Since there is no template language, the locations where to put data is declared as bindings. 

* **Binding key** is a string defining where in the markup to inject data:
 * **'.class'** are all elements that have this class
 * **'#id'** is the element with this id attribute
 * **'tag'** all elements with this tag, eg. 'title'
 * **''** the document location preceding the first tag
 * A **location** is an opening tag
 * A **tag** is not a comment, directive or unescaped text segment
 * An opening tag may be a void tag, ie. `<br/>`

* **Binding value** declares what to insert at the location

 * string 'datafield' a key in the data values provided in the **options object**
 * Array facilitates the same value or custom function to be applied multiple times
 * object: A number of custom functions applied

* Custom Functions
Typically values are inserted befire existing tag content.

 * fragment: 'fragmentname' insert the output from rendering a fragment, ie. a small piece of html
 * append: binding value Appends rather then inserts content
 * replace: binding value: replaces current element content
 * addClass: 'class1 class2': adds the listed classes to the tag
 * removeClass 'class1 class2': removes the listed classes from the tag
 * attribute: { id: false, display:'none'}: removes the id attribute, and inserts the attribute display=none

 Custom functions coded in JavaScript can be added that be used both on the server and in the browser.

## Compile to a View Executable

A view is compiled on server startup. Compiling takes the view and a bindings object to produce a view executable. The **view executable** can render both on the server and in the browser.

### Server

Views are rendered as usual. A bindings field provided at rendering may include additional fragments and custom functions.

### Browser

* In the browser: **WF.render**(data, fragment, domain) produces a string of rendered html

 * data: a JavaScript object containing data fields
 * fragment a fragment name such as 'list' or 'list.index'
 * domain: optional domain for the fragment

Fragments are associated with the view where they were declared. A view declaring fragments is known as a domain. When a fragment without a domain is included, the parent fragments's domain is first searched for the fragment name, then the first domain containing that fragment name is used. To render from an exact domain use 'list.index' to only search the index domain.

## Custom Functions

Webfiller facilitates dual-side JavaScript that is executed both on the server and in the browser. Webfiller provides a small set of basic functions, and custom functions can add or override those functions. The benefit is that the same custom code is neatly organized and available both in the browser and on the server at no extra effort.

## Folder Structure

Webfiller uses two folders: the view folder and the webfiller folder. The webfiller folder has files written to it that should be aviailable as Web resources for the browser. Typically this is one JavaScript and one css file copied from support files for each main view.

* The view folder contains each main view as an html file, eg. 'index.html'
* Each main view can have a **sibling folder** containing support files

All code, markup and styling pertaining to a main view is enclosed in the main view and its sibling folder. This has a benefit that it makes it really easy to copy a view to another project.

### Domain folder

* if there is a JavaScript file in the sibling folder, by the same name as the main view, then three exports is used from this file:

 * getHandler export: a **handler function** that Express uses to render the view
 * fragments: A Javascript object with fragment names and their bindings.
 * publicFragments: fragments that will be made available to the browser

Javascript provided to the browser:

* Any file in the **_1** subfolder is browser JavaScript and will be made available in the webfiller folder
* Any file ending with **_2.js** is dual-side JavaScript and will be made available in the webfiller folder
* Any file ending with **.css** is styling and will be made available in the webfiller folder

### Example File Collection

In Express' root views folder:

* index.html - a main view for the site's root url '/'
* index - a sibling folder

    * index.js the server-side handler function for the index view
    * index.css styling for the index view
    * index_2.js dual side JavaScript for the index view
    * list.html the fragment 'list.index'
    * tree.html the fragment 'tree.index'
    * _1 subfolder: contains front-end files (indexfrontend.js) JavaScript pertaining to the index view

* otherview.html - the view '/otherview'
* otherview - a sibling folder containing fragment, code and styling for otherview

# Reference

TODO examples

# Notes

(c) [Harald Rudell](http://www.haraldrudell.com) wrote this for node in August, 2012

No warranty expressed or implied. Use at your own risk.

Please suggest better ways, new features, and possible difficulties on [github](https://github.com/haraldrudell/webfiller)