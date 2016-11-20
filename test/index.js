var assert = require('assert');
var cheerio = require('cheerio');
var collections = require('metalsmith-collections');
var preprocess = require('..');
var Metalsmith = require('metalsmith');

describe('Initialization', function () {
  it('should complain if collection has not been set', function (done) {
    var metalsmith = Metalsmith('test/fixtures/basic');
    metalsmith
      .use(preprocess())
      .build(function (err, files){
        assert.ok(err, "is an error");
        assert.ok(err.message.includes('Collection'), "is collection error");
        done();
      });
  });
  it('should complain if preprocess file is not found');
});

describe('Rendering', function () {
  it('should call preprocess.asyncLoad and other exported preprocess', function (done) {
    var metalsmith = Metalsmith('test/fixtures/basic1');
    metalsmith
      .use(collections({
        content: {
          pattern: 'index.html',
        }
      }))
      .use(preprocess())
      .build(function (err, files){
        if (err) return done(err);
        $ = cheerio.load(files['index.html'].contents.toString());
        assert.equal($('#test').text(), '2')
        done();
      });
  });

  it('should render d3', function (done) {
    var metalsmith = Metalsmith('test/fixtures/d3');
    //needs to use collections, but why doesn't the error perculate up?
    metalsmith
      .use(collections({
        content: {
          pattern: 'index.html',
        }
      }))
      .use(preprocess())
      .build(function (err, files){
        if (err) return done(err);

        $ = cheerio.load(files['index.html'].contents.toString());

        // svg should be in there
        assert.ok($('#test').html().includes("circle"), "#test contains circle");
        done();
      });
  });
});
