'use strict';

// system modules
var fs     = require('fs');
var path   = require('path');
var stream = require('stream');

// utils
var q   = require('q');
var mmm = require('mmmagic');

// xlsx parser
var Excel = require('exceljs');
var Xlsx  = require('xlsx');

// csv parsers
var csv        = require('csv');
var csvrow     = require('csvrow');
var CSVSniffer = require('csv-sniffer')();

// my modules
var error = require('./error');

// instantiation
var Magic   = mmm.Magic;
var magic   = new Magic(mmm.MAGIC_MIME_TYPE);
var sniffer = new CSVSniffer();
var sniff   = sniffer.sniff;

// file consts
var fileType = {
  XLSX:   'xlsx',
  XLSXML: 'xls/xml',
  CSV:    'csv',
  TSV:    'tsv'
};

// options to be changed by rest server
var options = {
  defaultDelimiter: ',',
  sampleLines:      5
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
    ;
};
var joinRow          = function (row, del) {
  return del === ','
    ? csvrow.stringify(row)
    : row.join(del)
    ;
};

var readContents       = function (file, cb) {
  error.ifNot(file, 'Must include file path');
  var def = q.defer();

  if (path.parse(file).root) {
    fs.readFile(file, function (err, data) {
      if (err) {
        def.reject(err);
      } else {
        def.resolve(data.toString());
      }
    });
  } else {
    def.resolve(file); // file === contents
  }

  return def.promise.nodeify(cb);
};
var determineDelimiter = function (file, cb) {
  return readContents(file)
    .then(function (data) {
      let lineChar;
      let head;
      let headRes;

      lineChar = determineLineChar(data);


      head = data
        .split(lineChar)
        .slice(0, options.sampleLines)
        .join(lineChar);

      headRes = sniff(head, {
        newLineStr: lineChar
      });

      if (!headRes.delimiter && !options.defaultDelimiter) {
        throw new Error('Unknown delimiter (based on file content)');
      }

      return headRes.delimiter || options.defaultDelimiter;
    })
    .nodeify(cb);
};


var getFileType    = function (file, cb) {
  error.ifNot(file, 'Must include file path');
  var def = q.defer();

  magic.detectFile(file, function (err, res) {
    error.if(err);

    if (res.match(/spreadsheet/)) {
      def.resolve(getFileType.XLSX);
    } else if (res.match(/xml$/i)) {
      def.resolve(getFileType.XLSXML);
    } else if (res.toLowerCase() === 'text/plain') {
      determineDelimiter(file)
        .then(function (del) {
          if (del === '\t') {
            def.resolve(getFileType.TSV);
          } else if (del === ',') {
            def.resolve(getFileType.CSV);
          } else {
            def.reject(new Error('Unknown file type text/plain (based on file content), but delimiter unknown: ' + res));
          }
        })
      ;
    } else {
      def.reject(new Error('Unknown file type (based on file content): ' + res));
    }
  });

  return def.promise.nodeify(cb);
};
getFileType.XLSX   = fileType.XLSX;
getFileType.XLSXML = fileType.XLSXML;
getFileType.CSV    = fileType.CSV;
getFileType.TSV    = fileType.TSV;


var removeHeaderRows = function (file, cb) {
  return readContents(file)
    .then(function (data) {
      return determineDelimiter(data).then(function (del) {
        let lineChar = determineLineChar(data);
        let rows     = data.split(lineChar);

        let hRows  = 0;
        let cols   = 0;
        let exists = function (i) {
          return i;
        };

        for (let i = 0, l = rows.length; i < l; i++) {
          let next = parseRow(rows[i], del)
            .filter(exists)
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

var normalizeColumnCounts = function (file, cb) {
  return readContents(file)
    .then(function (data) {
      return determineDelimiter(data).then(function (del) {
        // console.log(data);
        let lineChar = determineLineChar(data);
        let rows     = data
              .split(lineChar)
              .map(r => parseRow(r, del))
          ;
        let max      = rows.reduce((max, r) => r.length > max ? r.length : max, 0);

        rows = rows.map(r => r.length < max ? r.concat(new Array(max - r.length).join('.').split('.')) : r);

        return rows
          .map(r => joinRow(r, del))
          .join(lineChar)
          ;
      });
    })
    .nodeify(cb);
};

var xlsxToCSV = function (file, cb) {
  error.ifNot(file, 'Must include file path');
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

var xmlToCSV = function (file, cb) {
  error.ifNot(file, 'Must include file path');
  var def = q.defer();

  try {
    let wb         = Xlsx.readFile(file);
    let firstSheet = wb.SheetNames[0] || false;
    error.ifNot(firstSheet, 'Excel document must include at least one sheet.');

    let data = Xlsx.utils.sheet_to_csv(wb.Sheets[firstSheet]);
    csv.parse(data, function (err, data2) {
      error.if(err);

      // remove headers if requested
      //data2 = data2.slice(parseInt(program.removeHeader));

      // count number of remaining columns to prevent extraneous output
      //var cols = data2.reduce(function (greatest, row) {
      //  for (var i = row.length; i > 0; i--) {
      //    if (row[i - 1]) {
      //      break;
      //    }
      //  }
      //  return i > greatest ? i : greatest;
      //}, 0);
      //data2     = data2
      //  //remove extra cols
      //  .map(function (row) {
      //    return row.slice(0, cols);
      //  })
      //  //remove empty lines
      //  .filter(function (row) {
      //    return row.join('').trim() !== '';
      //  });

      csv.stringify(data2, function (err2, res) {
        error.if(err2);

        def.resolve(res);

      });
    });

  } catch (err) {
    def.reject(err);
  }

  return def.promise.nodeify(cb);
};


var _svToCSV = function (file, del, cb) { // eslint-disable-line no-underscore-dangle
  error.ifNot(del, 'Must include delimiter');

  return readContents(file)
    .then(function (data) {
      var def = q.defer();

      csv.parse(data, {
        delimiter: del,
        // relax_column_count: true
      }, function (err, rows) {
        if (err) {
          def.reject(err);
        } else {
          csv.stringify(rows, {}, function (err2, str) {
            if (err2) {
              def.reject(err2);
            }

            def.resolve(str);
          });
        }
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

var checkTypeAndConvert = function (filePath, cb) {
  return getFileType(filePath)
    .then(function (type) {
      switch (type) {
        case fileType.XLSXML:
          return xmlToCSV(filePath)
            .then(removeHeaderRows)
            .then(csvToCSV);

        case fileType.XLSX:
          return xlsxToCSV(filePath)
            .then(removeHeaderRows)
            .then(normalizeColumnCounts)
            .then(csvToCSV);

        case fileType.CSV:
          return removeHeaderRows(filePath)
            .then(csvToCSV);

        case fileType.TSV:
          return removeHeaderRows(filePath)
            .then(tsvToCSV);

        default: //
          return new Error('Data Type Unknown.');
      }
    })
    .nodeify(cb);
};


var httpHandler = function (req, res) {
  error.ifNot(req.files && req.files.file, 'file missing from request. File not given or bodyParser has not been called.');

  var file = req.files.file;
  checkTypeAndConvert(file.path)
    .then(function (csvOut) {
      res.header('Content-Type', 'text/csv');
      res.send(csvOut);
    })
    .fail(function (err) {
      console.error(err, err.stack);
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
  normalizeColumnCounts,

  xlsxToCSV,
  xmlToCSV,
  csvToCSV,
  tsvToCSV,
  _svToCSV,

  checkTypeAndConvert,
  httpHandler,

  __determineLineChar:  determineLineChar,
  __determineDelimiter: determineDelimiter,
  __readContents:       readContents
};
