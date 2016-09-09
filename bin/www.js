#!/usr/bin/env node
'use strict';

var restify = require('restify');
//var errors = require('restify-errors');
var toCSV = require('../lib');

var pkg = require('../package.json');

// Get untrackable configurations.
var config = {};
try {
  config = require('../config.json'); //eslint-disable-line global-require
} catch (err) {
  if (!err.message || err.code !== 'MODULE_NOT_FOUND') {
    throw err;
  }
}

var serviceName = process.env.npm_package_name || pkg.name;


var server = restify.createServer({
  name:    serviceName,
  version: '1.0.0'
});


server.post('/', restify.bodyParser(), toCSV.httpHandler);


server.listen(config.port || process.env.PORT || process.env.npm_package_config_port || 15000);
