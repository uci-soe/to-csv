# CSV Conversion Server [![NPM version][npm-image]][npm-url] [![Build Status][travis-image]][travis-url] [![Dependency Status][daviddm-image]][daviddm-url] [![Coverage percentage][coveralls-image]][coveralls-url]
Converts an XLSX, XLS, TSV, or CSV file to CSV. It bases changes on content, not file ext. This is handy for Chalk \& Wire files as they export TSV or TSV labeled XLS.

Built in is a header/meta data remover. For Chalk & Wire, and other, files with meta-data rows placed in the top describing the file, this will remove them by parsing for a sudden change on content column length. presently this change is 2 + columns.

### Example

Below is an example of a csv file with 4 rows of meta data/headers, not referring to the column headers.

```
content,example
date,"Monday, june 5th, 2015"
other field,other value,
some field,some val, another val
Col Header 1,Col Header 2,Col Header 3,Col Header 4,Col Header 5
content a1,content a2,content a3,content a4
content b1,content b2,content b3,content b4,content b5
content c1,content c2,content c3,content c4
content d1,content d2,content d3,content d4,content d5
content e1,content e2,content e3,content e4,content e5
content f1,content f2,content f3,content f4,content f5
```

The above will output to:

```
Col Header 1,Col Header 2,Col Header 3,Col Header 4,Col Header 5
content a1,content a2,content a3,content a4
content b1,content b2,content b3,content b4,content b5
content c1,content c2,content c3,content c4
content d1,content d2,content d3,content d4,content d5
content e1,content e2,content e3,content e4,content e5
content f1,content f2,content f3,content f4,content f5
```

This happens because the sudden change in column numbers from 3 (@ row 4) to 5 (@ row 6). Because the change is greater than 1 column, it is registered as headers and drops the above.

This behavior is default and cannot be disabled yet.

## Install (to be written)
Add text here

## Usage (to be written)
This can be used as a module or a server. To use as a module, install through NPM (still determining how to do this exactly) and require as normal

```javascript
var toCSV = require('to-csv');

var fileXLSX = "test/samples/MS-Spring-2015.xlsx";
var fileXLS = "test/samples/MS-Spring-2015.xls"; // this file is a TSV file labeled *.xls, 
                                                    //as is Chalk & Wire's normal output 
                                                    //and will produce errors when put into toCSV.xlsxToCSV 
var fileCSV = "test/samples/MS-Spring-2015.csv";

toCSV.xlsxToCSV(fileXLSX, function (err, res) {
  if (err) {
    throw err;
  }
  console.log(res); // CSV text
});


// since systems like Chalk & Wire produce TSV files with a *.xls name, 
//    this will examine the content to determine the type
toCSV.getFileType(fileXLS, function(err, type){ 
  if (err) {
    throw err;
  }
  console.log(type); // will output "tsv"
});
```

### List of public functions
- getFileType 
  - takes filePath and callback 
  - returns Q Promise 
  - will return fileType, eventually 
  - Gets file type based on file contents. If file type is not one normally handled by this server, it will throw an error 
- removeHeaderRows 
  - takes filePath or content and callback 
  - returns Q Promise 
  - will return csv/tsv w/o meta headers, eventually 
  - Finds if there are meta headers and removes them. see above example in [Example](#example)
- xlsxToCSV
  - takes filePath or content and callback 
  - returns Q Promise 
  - will return csv, eventually 
  - Converts well formed xls, xlsx, ots, etc files to csv
- csvToCSV
  - takes filePath or content and callback 
  - returns Q Promise 
  - will return csv, eventually 
  - Converts csv files to well formed csv
- tsvToCSV
  - takes filePath or content and callback 
  - returns Q Promise 
  - will return csv, eventually 
  - Converts tsv files to well formed csv
- _svToCSV
  - takes filePath or content and string of delimiter and callback 
  - returns Q Promise 
  - will return csv, eventually 
  - Converts *sv (anything separated value) files to well formed csv
- httpHandler
  - takes `request` object with `{files:{file:{path:"path/to/file.ext"}}}` and a `response` object with `{send: function(){...}}` 
  - will convert contents at `request.files.file.path` to string oc well formed CSV and send using `response.send(csvData);` 

## License
BSD 2-Clause Simplified. See [LICENSE](LICENSE) for full info.

## Contributors

- [Rhett Lowe](https://github.oit.uci.edu/rhett)


[npm-image]: https://badge.fury.io/js/srv-to-csv.svg
[npm-url]: https://npmjs.org/package/srv-to-csv
[travis-image]: https://travis-ci.org/uci-soe/to-csv.svg?branch=master
[travis-url]: https://travis-ci.org/uci-soe/to-csv
[daviddm-image]: https://david-dm.org/uci-soe/to-csv.svg?theme=shields.io
[daviddm-url]: https://david-dm.org/uci-soe/to-csv
[coveralls-image]: https://coveralls.io/repos/uci-soe/to-csv/badge.svg
[coveralls-url]: https://coveralls.io/r/uci-soe/to-csv
