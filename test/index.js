var assert = require('assert');
var cheerio = require('cheerio');
var collections = require('metalsmith-collections');
var preprocess = require('..');
var Metalsmith = require('metalsmith');

describe('Initialization', () => {
  it('should complain if collection has not been set', (done) => {
    var metalsmith = Metalsmith('test/fixtures/basic');
    metalsmith
      .use(preprocess())
      .build((err, files) => {
        assert.ok(err, "is an error");
        assert.ok(err.message.includes('Collection'), "is collection error");
        done();
      });

  });

  it('should not complain if collection has no files', (done) => {
    var metalsmith = Metalsmith('test/fixtures/basic');
    metalsmith
      .use(collections({
        content: {
          pattern: 'nada.html',
        }
      }))
      .use(preprocess())
      .build((err, files) => {
        assert.ok(files, "has files");
        done();
      });
  });

  it('should complain if preprocess collection id not found', (done) => {
    var metalsmith = Metalsmith('test/fixtures/basic');
    metalsmith
      .use(collections({
        randomName: {
          pattern: 'index.html',
        }
      }))
      .use(preprocess())
      .build((err, files) => {
        assert.ok(err, "is an error");
        assert.ok(err.message.includes('Collection'), "is collection error");
        done();
      });
  });

  it('should load user specified collections', (done) => {
    var metalsmith = Metalsmith('test/fixtures/basic1');
    metalsmith
      .use(collections({
        randomName: {
          pattern: 'index.html',
        }
      }))
      .use(preprocess({collection: 'randomName'}))
      .build((err, files) => {
        if (err) return done(err);
        $ = cheerio.load(files['index.html'].contents.toString());
        assert.equal($('#test').text(), '2')
        done();
      });
  });

  it('should work with specified asyncLoad option and preprocess option', (done) => {
    var metalsmith = Metalsmith('test/fixtures/options');
    metalsmith
      .use(collections({
        content: {
          pattern: 'index.html',
        }
      }))
      .use(preprocess({ asyncLoad: 'testAsyncLoad',
                        preprocess: 'testPreprocess.js' }))
      .build((err, files) => {
        if (err) return done(err);
        $ = cheerio.load(files['index.html'].contents.toString());
        assert.equal($('#test').text(), '2')
        done();
      });
  });

});

describe('Rendering', () => {
  it('should call preprocess.asyncLoad and other exported preprocess', (done) => {
    var metalsmith = Metalsmith('test/fixtures/basic1');
    metalsmith
      .use(collections({
        content: {
          pattern: 'index.html',
        }
      }))
      .use(preprocess())
      .build((err, files) => {
        if (err) return done(err);
        $ = cheerio.load(files['index.html'].contents.toString());
        assert.equal($('#test').text(), '2')
        done();
      });
  });

  it('should render d3', (done) => {
    var metalsmith = Metalsmith('test/fixtures/d3');
    //needs to use collections, but why doesn't the error perculate up?
    metalsmith
      .use(collections({
        content: {
          pattern: 'index.html',
        }
      }))
      .use(preprocess())
      .build((err, files) => {
        if (err) return done(err);

        $ = cheerio.load(files['index.html'].contents.toString());

        // svg should be in there
        assert.ok($('#test').html().includes("circle"), "#test contains circle");
        done();
      });
  });
});
