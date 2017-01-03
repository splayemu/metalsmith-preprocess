const jsdom = require('jsdom');
const requireFromString = require('require-from-string');
const path = require('path');
const debug = require('debug')('metalsmith-preprocess');

module.exports = function (options) {
  const defaults = {
    preprocess: 'preprocess.js', // contains js code to run on server
    collection: 'content',
    asyncLoad: 'asyncLoad',
  }

  options = options || {};
  Object.keys(defaults).forEach((defaultOption) => {
    if (!options.hasOwnProperty(defaultOption))
      options[defaultOption] = defaults[defaultOption];
  });

  function preprocess (htmlFile, preprocess, filesInDirectory, files) {
    debug('runPreprocess', htmlFile.directory, preprocess);
    preprocess = requireFromString(preprocess.contents.toString(),
                                   path.join('src', preprocess.directory, preprocess.filename));

    // split renders and asyncLoad
    var loaded = preprocess.hasOwnProperty(options.asyncLoad) ?
                 preprocess[options.asyncLoad](htmlFile, filesInDirectory, files) :
                 Promise.resolve();

    return loaded.then((result) => {
      debug('then', htmlFile.directory);
      return new Promise((resolve, reject) => {
        jsdom.env({
          features: { QuerySelector: true },
          html: htmlFile.contents.toString(),
          done: (errors, window) => {
            if (errors)
              reject(errors);

            Object.keys(preprocess)
              .filter((key) => { return key !== options.asyncLoad; })
              .forEach((key) => {
                const renderer = preprocess[key];
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

  return (files, metalsmith, done) => {
    const promises = [];
    const re_filename = /^(\S+)\/(\S+)$/;

    debug('metalsmith-preprocess', Object.keys(files).length);

    // update or add directory and filename for each file
    Object.keys(files).forEach((file) => {
      const match = re_filename.exec(file);
      if (match === null) {
        files[file].directory = "";
        files[file].filename = file;
        return;
      }

      files[file].directory = match[1];
      files[file].filename = match[2];
    });

    const contentFilenames = Object.keys(files)
      // filter filepath list to content files only
      .filter((file) => {
        return new Set(files[file].collection).has(options.collection);
      });

    const collections = metalsmith.metadata().collections;

    // test for collection
    if (collections === undefined || !collections.hasOwnProperty(options.collection)) {
      done(Error("Collection, " +
                 options.collection +
                 ", Not Found. Check your metalsmith build."));
    }

    // create a map of content filenames to other filenames in the same directory
    const contentDirectories = new Map(
      contentFilenames.map((file) => {
        const filesInDirectory =
          new Set(Object.keys(files).filter((f) => { return file.directory === f.directory; }));
        return [file, filesInDirectory];
      }));

    // run preprocess functions for preprocess files found in content directories
    contentDirectories.forEach((filesInDirectory, file) => {
      const contentFile = files[file];
      const preprocessFilename = path.join(contentFile.directory, options.preprocess);

      if (!filesInDirectory.has(preprocessFilename)) return;

      debug('expecting', preprocessFilename, "with", filesInDirectory);
      promises.push(preprocess(contentFile, files[preprocessFilename], filesInDirectory, files));
    });

    // why doesn't then just accept done as an argument?
    debug('Checking promises:', promises);
    Promise.all(promises)
      .then((result) => { done(); })
      .catch((error) => { done(error); });
  }
}
