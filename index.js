var jsdom = require('jsdom');
var requireFromString = require('require-from-string');
var path = require('path');
var debug = require('debug')('metalsmith-preprocess');

module.exports = function (options) {
  var defaults = {
    filename: 'preprocess.js', // contains js code to run on server
    collection: 'content',
    asyncLoad: 'asyncLoad',
  }

  options = options || {};
  Object.keys(defaults).forEach(function (default_option) {
    if (!options.hasOwnProperty(default_option)) return;

    options[default_option] = defaults[default_option];
  });

  function preprocess (html_content, preprocess, files_in_directory, files) {
    console.log('runPreprocess', html_content.directory);
    preprocess = requireFromString(preprocess.contents.toString());

    // split renders and asyncLoad
    var loaded = preprocess.hasOwnProperty(defaults.asyncLoad) ?
                 preprocess[defaults.asyncLoad](html_content, files_in_directory, files) :
                 Promise.resolve();

    return loaded.then(function (result) {
      console.log('then', html_content.directory);
      return new Promise(function (resolve, reject) {
        jsdom.env({
          features: { QuerySelector: true },
          html: html_content.contents.toString(),
          done: function (errors, window) {
            if (errors)
              reject(errors);

            //
            Object.keys(preprocess)
              .filter(function (key) { return key !== defaults.asyncLoad; })
              .forEach(function (key) {
                var renderer = preprocess[key];
                renderer.call(window, window.document.querySelector.bind(window.document));
              });

            html_content.contents = Buffer.from(window.document.documentElement.innerHTML, 'utf-8');
            console.log('resolving', html_content.directory);
            resolve();
          }
        });
      });
    });
  }

  return function (files, metalsmith, done) {
    var promises = [];
    var re_filename = /^(\S+)\/(\S+)$/;

    console.log('metalsmith-preprocess', Object.keys(files).length);

    // update or add directory and filename for each file
    Object.keys(files).forEach(function (file) {
      var match = re_filename.exec(file);
      if (match === null) {
        files[file].directory = "";
        files[file].filename = file;
        return;
      }

      files[file].directory = match[1];
      files[file].filename = match[2];
    });

    var content_filenames = Object.keys(files)
      // filter filepath list to content files only
      .filter(function (file) {
        return new Set(files[file].collection).has(defaults.collection);
      });

    // test for collection
    if (defaults.collection !== null && content_filenames.length === 0) {
      done(Error("Collection, " +
                 defaults.collection +
                 ", is specified but does not match any files."));
    }

    // create a map of content filenames to other filenames in the same directory
    var content_directories = new Map(
      content_filenames.map(function (file) {
        var files_in_directory =
          new Set(Object.keys(files).filter(function (f) { return file.directory === f.directory; }));
        return [file, files_in_directory];
      }));

    // run preprocess functions for preprocess files found in content directories
    content_directories.forEach(function (files_in_directory, file) {
      var content_file = files[file],
          preprocess_filename = path.join(content_file.directory, defaults.filename);

      if (!files_in_directory.has(preprocess_filename)) return;

      console.log('expecting', preprocess_filename, "with", files_in_directory);
      promises.push(preprocess(content_file, files[preprocess_filename], files_in_directory, files));
    });

    // why doesn't then just accept done as an argument?
    console.log('Checking promises:', promises);
    Promise.all(promises)
      .then(function (result) { console.log('all files processed.'); done(); })
      .catch(function (error) { done(error); });
  }
}
