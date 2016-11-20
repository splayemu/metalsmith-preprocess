var counter = 0;

// check sure asyncLoad get's called first by forcing assignment
module.exports.asyncLoad = function (html_content, files_in_directory, files) {
  return new Promise(function (resolve, reject) {
    setTimeout(function () {
      counter = 1;
      resolve();
    }, 100);
  });
}

module.exports.test = function (query_selector) {
  counter++;

  el = query_selector('#test');
  el.innerHTML = counter;
}
