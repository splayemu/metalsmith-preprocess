Metalsmith-preprocess
===

Metalsmith plugin that runs JS on the server to update html and other files

## Installation

  npm install metalsmith-preprocess --save

Requires metalsmith-collections to already have run to select html files to modify. 
Node modules that are used for preprocessing need to be installed in your metalsmith environment.

## Usage

Relies on a directory structure similar to this:
  .
  ├── build.js
  ├── package.json
  ├── Readme.md
  └── src
      ├── index.html
      ├── post1
      │   ├── index.html
      │   └── preprocess.js
      └── post2
          ├── index.html
          └── preprocess.js

### Create preprocess.js files in each directory with html files you want to modify

Each preprocess.js exports functions of two types:

```javascript
// function asyncLoad is the default function name, but can be changed with options.
//   gets passed the html file in the directory, the filenames in the directory, and the metalsmith filename > file object map 
//   must return a Promise
module.exports.asyncLoad = function (html_content, files_in_directory, files) {
  return new Promise(function (resolve, reject) {
    ... 
  });
}

// Other functions exported are called in the context of jsdom on the html file in the directory.
// this = window
// query_selector is bound on window.document
module.exports.test = function (query_selector) {
  el = query_selector('#test');
  el.innerHTML = 'rendered';
}
```

###  Sample metalsmith build.js

```javascript
var Metalsmith = require('metalsmith');
var collections = require('metalsmith-collections');
var preprocess = require('metalsmith-preprocess');

Metalsmith()
  .use(collections({
    content: {
      pattern: './**/*.html',
    }
  }))
  .use(preprocess())
  .build(function (err, files){
    if (err) throw err;
    console.log('Success!');
  });
});
```

## Tests

npm test

## Posible Uses

* Prerender D3 visualizations and serve the static svg images
* Read, munge, and compress data files

## Notes

* For all function calls except asyncLoad:
  * context is set as window
  * query_selector is bound with window.document
  * To select with D3, first select on the document: d3.select(this.document). See [issue](https://github.com/d3/d3-request/issues/10).

## Release History

* 0.1.0 Initial release
