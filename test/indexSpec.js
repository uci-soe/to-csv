'use strict';

var assert = require('assert');
var path   = require('path');
var fs     = require('fs');
//var q      = require('q');
var csv = require('csv');

var toCSV = require('../lib');

/* Other Tests */
//require('./error');

/* Sample Files */
var samplesDir = path.normalize(path.join(__dirname, '/samples'));
var fileTSV    = samplesDir + '/MS-Spring-2015.xls';
var fileXLSX   = samplesDir + '/MS-Spring-2015.xlsx';
var fileCSV    = samplesDir + '/MS-Spring-2015.csv';

describe('toCSV', function () {

  it('should identify and remove header/meta data from top of document.', function (done) {
    let test = 'a,\na,b\na,b\nc,d\n\ne,f,g,h,i,j\nk,l,m,n,o,p\ne,f,g,h,i,j\nk,l,m,n,o,p\ne,f,g,h,i,j\nk,l,m,n,o,p';

    toCSV.removeHeaderRows(test, function (err, data) {
      assert(!err, 'Error called in removing headers: ' + (err ? err.message : ''));
      assert.equal(data.split('\n').length, 6, 'wrong number of lines found in comparing header rows');

      done();
    });
  });
  it('should identify and remove header/meta data from top of document, even with non-separating commas (in quotes).', function (done) {
    let test = 'a,\na,"b, c, d"\na,b\nc,d\n\ne,f,g,h,i,j\nk,l,m,n,o,p\ne,f,g,h,i,j\nk,l,m,n,o,p\ne,f,g,h,i,j\nk,l,m,n,o,p';

    toCSV.removeHeaderRows(test, function (err, data) {
      assert(!err, 'Error called in removing headers: ' + (err ? err.message : ''));
      assert.equal(data.split('\n').length, 6, 'wrong number of lines found in comparing header rows');

      done();
    });
  });
  it('should not remove header/meta data when not present.', function (done) {
    let test = 'e,f,g,h,i,j\nk,l,m,n,o,p\nq,r,s,t,u,v';

    toCSV.removeHeaderRows(test, function (err, data) {
      assert(!err, 'Error called in removing headers: ' + (err ? err.message : ''));
      assert.equal(data.split('\n').length, 3, 'wrong number of lines found in comparing header rows');

      done();
    });
  });
  it('should determine mime/file type based on content, not ext', function (done) {
    var ext = path.parse(fileTSV).ext;

    assert.equal(ext, '.xls', 'Sample file should be a *.xls file by name.');

    toCSV.getFileType(fileTSV)
      .then(function (res) {
        // the TSV file, should be names *.xls
        assert.notEqual(ext, '.' + res, 'found wrong data format based on content, check sample. Sample should be a TSV named *.xls'); // because of chalk and wire
      })
      .fail(function (err) {
        assert(!err, 'Error called in getting file type: ' + (err ? err.message : ''));
      })
      .done(done)
    ;
  });


  /*eslint-disable no-underscore-dangle */
  describe('__determineDelimiter', function () {
    it('determine the column delimiter of a CSV file.', function (done) {
      toCSV.__determineDelimiter(fileCSV, function (err, res) {
        assert(!err, 'Error called in getting file type: ' + (err ? err.message : ''));
        assert.equal(res, ',', 'failed to identify delimiter as ",", confirm format of sample file.');

        done();
      });
    });
    it('determine the column delimiter of a TSV file.', function (done) {
      toCSV.__determineDelimiter(fileTSV, function (err, res) {
        assert(!err, 'Error called in getting file type: ' + (err ? err.message : ''));
        assert.equal(res, '\t', 'failed to identify delimiter as "\\t", confirm format of sample file.');

        done();
      });
    });
    it('should accept callbacks', function (done) {
      toCSV.__determineDelimiter(fileTSV, function (err, res) {
        assert(!err, 'Error called in getting file type: ' + (err ? err.message : ''));
        assert.equal(res, '\t', 'failed to identify delimiter as "\\t", confirm format of sample file.');

        done();
      });
    });
    it('should return a promise', function (done) {
      var promise = toCSV.__determineDelimiter(fileTSV);
      assert(promise.then && promise.fail && promise.done, 'did not return promise/thenable');

      promise
        .then(function (res) {
          assert.equal(res, '\t', 'failed to identify delimiter as "\\t", confirm format of sample file.');
        })
        .fail(function (err) {
          assert(!err, 'Error called in getting file type: ' + (err ? err.message : ''));
        })
        .done(done)
      ;
    });
    it('should produce an error if no file/path given', function () {
      assert.throws(function () {
        toCSV.__determineDelimiter();
      }, /path/);
    });
  });
  /*eslint-enable no-underscore-dangle */


  /*eslint-disable no-underscore-dangle */
  describe('__determineLineChar', function () {
    var csvN  = 'a,b\nc,d';
    var tsvN  = 'a\tb\nc\td';
    var csvNR = 'a,b\n\rc,d';
    var tsvNR = 'a\tb\n\rc\td';
    var csvRN = 'a,b\r\nc,d';
    var tsvRN = 'a\tb\r\nc\td';
    var csvR  = 'a,b\rc,d';
    var tsvR  = 'a\tb\rc\td';

    it('determine find \\n newline char', function () {
      assert.equal(toCSV.__determineLineChar(csvN), '\n', 'Failed to detect \\n in csv');
      assert.equal(toCSV.__determineLineChar(tsvN), '\n', 'Failed to detect \\n in tsv');
    });
    it('determine find \\n\\r newline char', function () {
      assert.equal(toCSV.__determineLineChar(csvNR), '\n\r', 'Failed to detect \\n\\r in csv');
      assert.equal(toCSV.__determineLineChar(tsvNR), '\n\r', 'Failed to detect \\n\\r in tsv');
    });
    it('determine find \\r\\n newline char', function () {
      assert.equal(toCSV.__determineLineChar(csvRN), '\r\n', 'Failed to detect \\r\\n in csv');
      assert.equal(toCSV.__determineLineChar(tsvRN), '\r\n', 'Failed to detect \\r\\n in tsv');
    });
    it('determine find \\r newline char', function () {
      assert.equal(toCSV.__determineLineChar(csvR), '\r', 'Failed to detect \\r in csv');
      assert.equal(toCSV.__determineLineChar(tsvR), '\r', 'Failed to detect \\r in tsv');
    });
  });
  /*eslint-enable no-underscore-dangle */



  describe('getFileType', function () {
    it('should identify XLSX excel files', function (done) {
      toCSV.getFileType(fileXLSX, function (err, res) {
        assert(!err, 'Error called in getting file type: ' + (err ? err.message : ''));
        assert.equal(res, toCSV.fileType.XLSX, 'failed to identify data as XLS/XLSX, confirm format of sample file.');
        done();
      });
    });
    it('should identify plain text, csv files', function (done) {
      toCSV.getFileType(fileCSV, function (err, res) {
        assert(!err, 'Error called in getting file type: ' + (err ? err.message : ''));
        assert.equal(res, toCSV.fileType.CSV, 'failed to identify data as CSV, confirm format of sample file.');
        done();
      });
    });
    it('should identify plain text, tsv files', function (done) {
      toCSV.getFileType(fileTSV, function (err, res) {
        assert(!err, 'Error called in getting file type: ' + (err ? err.message : ''));
        assert.equal(res, toCSV.fileType.TSV, 'failed to identify data as TSV, confirm format of sample file.');
        done();
      });
    });
    it('should accept callbacks', function (done) {
      toCSV.getFileType(fileCSV, function (err, res) {
        assert(!err, 'Error called in getting file type: ' + (err ? err.message : ''));
        assert.equal(res, toCSV.fileType.CSV, 'failed to identify data as XLS/XLSX, confirm format of sample file.');

        done();
      });
    });
    it('should return a promise', function (done) {
      var promise = toCSV.getFileType(fileCSV);
      assert(promise.then && promise.fail && promise.done, 'getFileType did not return promise/thenable');

      promise
        .then(function (res) {
          assert.equal(res, toCSV.fileType.CSV, 'failed to identify data as XLS/XLSX, confirm format of sample file.');
        })
        .fail(function (err) {
          assert(!err, 'Error called in getting file type: ' + (err ? err.message : ''));
        })
        .done(done)
      ;
    });
    it('should produce an error if no file/path given', function () {
      assert.throws(function () {
        toCSV.getFileType();
      }, /path/);
    });
  });

  /*eslint-disable max-nested-callbacks */
  fs.readdir(samplesDir, function (err, files) {
    assert.ifError(err);
    [
      'sample-out',
      '.DS_Store'
    ].forEach(function (f) {
      let i = files.indexOf(f);
      if (i > -1) {
        files.splice(i, 1);
      }
    });

    describe('End to end tests', function () {

      files.forEach(function (file) {

        describe(file, function () {
          it(file + ' should convert to CSV without errors', function (done) {
            this.timeout(3000);
            assert.doesNotThrow(function () {

              toCSV.httpHandler(
                { // Request
                  files: {
                    file: {
                      path: path.join(samplesDir, file)
                    }
                  }
                },
                { // Response
                  send:   function (text) {
                    if (typeof text === 'object' && text instanceof Error) {
                      throw text;
                    }
                    csv.parse(text, function (err2, val) {
                      assert.ifError(err2);
                      assert(val);

                      fs.writeFile(path.join(samplesDir, 'sample-out', file) + '.csv', text);

                      done();
                    });
                  },
                  header: function () {
                    // Placeholder
                  }
                }
              );

            }, 'i hate you ');
          });
        });

      });

    });
  });
  /*eslint-enable max-nested-callbacks */


});
