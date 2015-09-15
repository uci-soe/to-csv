# CSV Conversion Server
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
Add text here

## License
Still working on this. See [LICENSE](LICENSE) for full info.

## Contributors

 © [Rhett Lowe](https://github.oit.uci.edu/rhett)
