'use strict';

var utils        = require('./utils'),
    fs           = require('fs'),
    a11y         = require('a11y'),
    map          = require('map-stream'),
    gutil        = require('gulp-util'),
    logSymbols   = require('log-symbols'),
    indentString = require('indent-string');

var PluginError  = gutil.PluginError;

var a11yPlugin = function (opts) {

  return map(function (file, cb) {
    a11y(file.path, opts || {}, function (err, report) {

      if (err) {
        cb(new PluginError('gulp-a11y', { name: 'a11y', message: err.message }), file);
      }

      file.a11yExport = opts.export || {}

      file.a11y = report;

      cb(null, file);

    });
  });

};

a11yPlugin.failOnError = function () {

  return map(function (file, cb) {

    var report = utils.formatReport(file, file.a11y, true),
        error  = null;

    if (report) {
      error = new PluginError('gulp-a11y', {
        name: 'a11y',
        fileName: file.path,
        message: report
      });
    }

    cb(error, file);

  });

};

a11yPlugin.failAfterError = function () {

  var errors = [];

  return map(function (file, cb) {

    var report = utils.formatReport(file, file.a11y, true);

    if (report) {
      errors.push(report);
    }

    cb(null, file);

  }).once('end', function () {

    if (errors.length) {
      var error = new PluginError('gulp-a11y', {
        name: 'a11y',
        message: errors.join('\n')
      });

      this.emit('error', error);
    }

  });

};

a11yPlugin.reporter = function (writable) {

  var results = [];

  writable = utils.resolveWritable(writable);

  return map(function (file, cb) {

    var error = null;

    if (file.a11yExport) {
      fs.writeFile(JSON.stringify(file.a11yExport), file.a11y, function(err) {

        if (err) {
          error = new PluginError('gulp-a11y', {
            name: 'a11y',
            fileName: file.path,
            message: err
          });
        } else {
          gutil.log("The report was saved!");
        }

      });
    }

    var report = utils.formatReport(file, file.a11y);

    if (report) {
      results.push(report);
    }

    cb(null, file);

  }).once('end', function () {

    if (results.length) {
      utils.writeReport(results.join(''), writable);
    }

    results = [];

  });

};

module.exports = a11yPlugin;
