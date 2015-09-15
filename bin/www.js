#!/usr/bin/env node

var restify = require('restify');
var errors = require('restify-errors');
var toCSV = require('../lib');

// Get untrackable configurations.
var config = {};
try {
  config = require('../config.json');
} catch (err) {
  if (!err.message || err.code !== 'MODULE_NOT_FOUND') {
    throw err;
  }
}

var serviceName = process.env.npm_package_name || require('../package.json').name;


var server = restify.createServer({
  name: serviceName,
  version: '1.0.0'
});


server.post('/', restify.bodyParser(), toCSV.httpHandler);


server.listen(config.port || process.env.npm_package_config_port || 15000);
