'use strict';

// system modules
var fs         = require('fs');
var path       = require('path');
var stream     = require('stream');

// utils
var q          = require('q');
var mmm        = require('mmmagic');

// xlsx parser
var Excel      = require('exceljs');

// csv parsers
var csv        = require('csv');
var csvrow     = require('csvrow');
var CSVSniffer = require('csv-sniffer')();

// my modules
var error = require('./error');

// instantiation
var Magic   = mmm.Magic,
    magic   = new Magic(mmm.MAGIC_MIME_TYPE);
var sniffer = new CSVSniffer(),
    sniff   = sniffer.sniff;

// file consts
var fileType = {
  XLSX: "xlsx",
  CSV : "csv",
  TSV : "tsv"
};

// options to be changed by rest server
var options  = {
  defaultDelimiter: ',',
  sampleLines     : 5
};

// Small parsing functions
var determineLineChar = function (sample) {
  let match = sample.match(/(\n\r|\r\n|\n|\r)/);
  return match[1] || false;
};
var parseRow          = function (row, del) {
  return del === ','
    ? csvrow.parse(row)
    : row.split(del)
};

var readContents       = function (file, cb) {
  error.ifNot(file, "Must include file path");
  var def = q.defer();

  if (!path.parse(file).root) {
    def.resolve(file); // file === contents
  } else {
    fs.readFile(file, function (err, data) {
      if (err) {
        def.reject(err);
      } else {
        def.resolve(data.toString());
      }
    });
  }

  return def.promise.nodeify(cb);
};
var determineDelimiter = function (file, cb) {
  return readContents(file)
    .then(function (data) {
      let lineChar, head, headRes;

      lineChar = determineLineChar(data);


      head = data
        .split(lineChar)
        .slice(0, options.sampleLines)
        .join(lineChar);

      headRes = sniff(head, {
        newLineStr: lineChar
      });

      if (headRes.delimiter) {
        return headRes.delimiter;
      } else if (options.defaultDelimiter) {
        return options.defaultDelimiter;
      } else {
        throw new Error("Unknown delimiter (based on file content)");
      }
    })
    .nodeify(cb);
};


var getFileType  = function (file, cb) {
  error.ifNot(file, "Must include file path");
  var def = q.defer();

  magic.detectFile(file, function (err, res) {
    error.if(err);

    if (res.match(/spreadsheet/)) {
      def.resolve(getFileType.XLSX);
    } else if (res.toLowerCase() === "text/plain") {
      determineDelimiter(file)
        .then(function (del) {
          if (del === '\t') {
            def.resolve(getFileType.TSV);
          } else if (del === ',') {
            def.resolve(getFileType.CSV);
          } else {
            def.reject(new Error("Unknown file type text/plain (based on file content), but delimiter unknown: " + res));
          }
        })
      ;
    } else {
      def.reject(new Error("Unknown file type (based on file content): " + res));
    }
  });

  return def.promise.nodeify(cb);
};
getFileType.XLSX = fileType.XLSX;
getFileType.CSV  = fileType.CSV;
getFileType.TSV  = fileType.TSV;


var removeHeaderRows = function (file, cb) {
  return readContents(file)
    .then(function (data) {
      return determineDelimiter(data).then(function (del) {
        let lineChar = determineLineChar(data);
        let rows     = data.split(lineChar);

        let hRows = 0, cols = 0;
        for (let i = 0, l = rows.length; i < l; i++) {
          let next = parseRow(rows[i], del)
            .filter(i => i)
            .length;

          if (cols && next > cols + 1) {
            hRows = i;
            break;
          }
          if (next) {
            cols = next;
          }
        }

        return rows.slice(hRows).join(lineChar);
      });
    })
    .nodeify(cb);
};


var xlsxToCSV = function (file, cb) {
  error.ifNot(file, "Must include file path");
  var def = q.defer();

  try {
    var workbook = new Excel.Workbook();
    workbook.xlsx.readFile(file)
      .then(function () {

        var out = '';

        var writable = new stream.Writable({
          write: function (chunk, encoding, next) {
            out += chunk.toString();
            next();
          }
        });

        workbook
          .csv
          .write(writable)
          .then(function () {
            writable.end();
            def.resolve(out);
          });

      });
  } catch (err) {
    def.reject(err);
  }

  return def.promise.nodeify(cb);
};

var _svToCSV = function (file, del, cb) {
  error.ifNot(del, "Must include delimiter");

  return readContents(file)
    .then(function (data) {
      var def = q.defer();

      csv.parse(data, {
        delimiter: del
      }, function (err, rows) {
        if (err) {
          def.reject(err);
        }

        csv.stringify(rows, {}, function (err, str) {
          if (err) {
            def.reject(err);
          }

          def.resolve(str);
        });

      });

      return def.promise;
    })
    .nodeify(cb);
};
var csvToCSV = function (file, cb) {
  return _svToCSV(file, ',', cb);
};
var tsvToCSV = function (file, cb) {
  return _svToCSV(file, '\t', cb);
};


var httpHandler = function (req, res) {
  error.ifNot(req.files && req.files.file, "file missing from request. File not given or bodyParser has not been called.");
  var file = req.files.file;
  getFileType(file.path)
    .then(function (type) {
      switch (type) {
        case fileType.XLSX:
          return xlsxToCSV(file.path)
            .then(removeHeaderRows)
            .then(csvToCSV);
          break;

        case fileType.CSV:
          return removeHeaderRows(file.path)
            .then(csvToCSV);
          break;

        case fileType.TSV:
          return removeHeaderRows(file.path)
            .then(tsvToCSV);
          break;

        default: //
          return new Error("Data Type Unknown.");
          break;
      }
    })
    .then(function (csv) {
      console.log(csv)
    })
    .fail(function (err) {
      res.send(err);
    })
    .done()
  ;
};


module.exports = {
  options,
  fileType,

  getFileType,
  removeHeaderRows,

  xlsxToCSV,
  csvToCSV,
  tsvToCSV,
  _svToCSV,

  httpHandler,

  __determineLineChar : determineLineChar,
  __determineDelimiter: determineDelimiter,
  __readContents      : readContents,
};



