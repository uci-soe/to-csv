'use strict';

var q = require('q');
var mmm = require('mmmagic');
var CSVSniffer = require('csv-sniffer')();

var error = require('./error');

var Magic = mmm.Magic;
var magic = new Magic(mmm.MAGIC_MIME_TYPE);
var sniffer = new CSVSniffer();

var fileType = {
  XLSX: "xlsx",
  CSV: "csv",
  TSV: "tsv"
};

var determineLineChar = function (sample) {
  let match = sample.match(/(\n\r|\r\n|\n|\r)/);
  return match[1] || false;
};
var countColumns = function (rows) {
  error.if(!rows.reduce, "rows must be an array");
  return rows.reduce(function(l,n){
    return n.length > l ? n.length : l;
  }, 0);
};

var determineDelimiter = function(file, cb){
  error.if(!file, "Must include file path");
  var def = q.defer();

  fs.readFile(file, function(err, data){
    error.if(err);

    let lineChar, head, tail, headRes, tailRes;

    data = data.toString();
    lineChar = determineLineChar(data);

    data = data.split(lineChar);

    head = data.slice(0,sampleLines).join(lineChar);
    tail = data.slice(-sampleLines).join(lineChar);

    headRes = sniffer.sniff(head);
    tailRes = sniffer.sniff(tail);
  });

  return def.promise.nodeify(cb);
};


var getFileType = function (file, cb) {
  error.if(!file, "Must include file path");
  var def = q.defer();

  magic.detectFile(loc, function(err, res) {
    error.if(err);
    if (res.match(/spreadsheet/)) {
      def.resolve(getFileType.XLSX);
    } else if (res.toLowerCase() === "text/plain") {
      def.resolve(determineDelimiter(file));
    } else {
      def.reject(new Error("Unknown file type (based on file content): " + res));
    }
  });

  return def.promise.nodeify(cb);
};
getFileType.XLSX = fileType.XLSX;
getFileType.CSV = fileType.CSV;
getFileType.TSV = fileType.TSV;






module.exports = {
  fileType,
  getFileType,

  __determineLineChar: determineLineChar,
  __determineDelimiter: determineDelimiter,
  __countColumns: countColumns,
};
