Metalsmith-preprocess
===

Metalsmith plugin that runs JS on the server to update html and other files

## Installation

  npm install metalsmith-preprocess --save

Requires [metalsmith-collections](https://github.com/segmentio/metalsmith-collections) to already have run to select html files to modify. 
Node modules that are used for preprocessing need to be installed in your metalsmith environment.

## Usage
### 1. Require metalsmith-preprocess and invoke it in the metalsmith pipeline

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

#### Options
Pass options via an object when calling preprocess. Available options:
* collection - change the name of collection, see [metalsmith-collections](https://github.com/segmentio/metalsmith-collections), that preprocess looks for as content files
* asyncLoad - change the name of the asynchronous loading function called in each preprocess file
* preprocess - change the name of the preprocess file to search for

```javascript
// example with options
Metalsmith()
  .use(collections({
    nameOfCollection: {
      pattern: './**/*.html',
    }
  }))
  .use(preprocess({
     collection: 'nameOfCollection',
     preprocess: 'myPreprocessFile.js',
     asyncLoad: 'myAsyncLoadFunctionName',
  }))
  .build(function (err, files){
    if (err) throw err;
    console.log('Success!');
  });
});
```

### 1. Create preprocess.js files in each directory with html files you want to modify

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

## Tests

npm test

## Possible Uses

* Prerender D3 visualizations and serve the static svg images
* Read, munge, and compress data files

## Examples
See [tests](./test)

## Notes

* For all function calls except asyncLoad:
  * context is set as window
  * query_selector is bound with window.document
  * To select with D3, first select on the document: d3.select(this.document). See [issue](https://github.com/d3/d3-request/issues/10).
  * Cannot render certain functions such as getBBox because it uses jsdom

## Release History

* 0.1.0 Initial release
* 0.1.1 Update documentation, Add unit tests, Fix options
