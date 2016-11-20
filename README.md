Runs JS on the server to modify files in a directory structure.

## Examples
* Prerender D3 visualizations and serve the static svg images
* Read, munge, and compress data files

## Installation
Requires metalsmith-collections to already have run to select the primary html file to modify. Node modules that are used in preprocessing need to be installed in your metalsmith environment.

## Notes
* For all function calls except asyncLoad:
  * context is set as window
  * query_selector is bound with window.document
  * To select with D3, first select on the document: d3.select(this.document). See [issue](https://github.com/d3/d3-request/issues/10).
