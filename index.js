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
  Object.keys(defaults).forEach(function (defaultOption) {
    if (!options.hasOwnProperty(defaultOption))
      options[defaultOption] = defaults[defaultOption];
  });

  function preprocess (htmlFile, preprocess, filesInDirectory, files) {
    debug('runPreprocess', htmlFile.directory, preprocess);
    preprocess = requireFromString(preprocess.contents.toString(),
                                   path.join('src', preprocess.directory, preprocess.filename));

    // split renders and asyncLoad
    var loaded = preprocess.hasOwnProperty(defaults.asyncLoad) ?
                 preprocess[defaults.asyncLoad](htmlFile, filesInDirectory, files) :
                 Promise.resolve();

    return loaded.then(function (result) {
      debug('then', htmlFile.directory);
      return new Promise(function (resolve, reject) {
        jsdom.env({
          features: { QuerySelector: true },
          html: htmlFile.contents.toString(),
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

            htmlFile.contents = Buffer.from(window.document.documentElement.innerHTML, 'utf-8');
            debug('resolving', htmlFile.directory);
            resolve();
          }
        });
      });
    });
  }

  return function (files, metalsmith, done) {
    var promises = [];
    var re_filename = /^(\S+)\/(\S+)$/;

    debug('metalsmith-preprocess', Object.keys(files).length);

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

    var contentFilenames = Object.keys(files)
      // filter filepath list to content files only
      .filter(function (file) {
        return new Set(files[file].collection).has(defaults.collection);
      });

    // test for collection
    if (defaults.collection !== null && contentFilenames.length === 0) {
      done(Error("Collection, " +
                 defaults.collection +
                 ", is specified but does not match any files."));
    }

    // create a map of content filenames to other filenames in the same directory
    var contentDirectories = new Map(
      contentFilenames.map(function (file) {
        var filesInDirectory =
          new Set(Object.keys(files).filter(function (f) { return file.directory === f.directory; }));
        return [file, filesInDirectory];
      }));

    // run preprocess functions for preprocess files found in content directories
    contentDirectories.forEach(function (filesInDirectory, file) {
      var contentFile = files[file],
          preprocessFilename = path.join(contentFile.directory, defaults.filename);

      if (!filesInDirectory.has(preprocessFilename)) return;

      debug('expecting', preprocessFilename, "with", filesInDirectory);
      promises.push(preprocess(contentFile, files[preprocessFilename], filesInDirectory, files));
    });

    // why doesn't then just accept done as an argument?
    debug('Checking promises:', promises);
    Promise.all(promises)
      .then(function (result) { done(); })
      .catch(function (error) { done(error); });
  }
}
