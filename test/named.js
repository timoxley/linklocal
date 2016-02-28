"use strict"

var test = require('tape')

var fs = require("fs")
var path = require('path')
var exec = require('child_process').exec
var rimraf = require('rimraf')

var linklocal = require("../")
var namedPackagePath = 'test/named';

var PKG_DIR = path.resolve(__dirname, 'named')

test('will link a named package', function(t) {
  var options = {
    recursive: false,
    cwd: path.resolve(process.cwd(), namedPackagePath),
    packages: ['namedProj1']
  }

  linklocal.named(PKG_DIR, function(err, linked) { 
    t.ifError(err)
    t.ok(linked)
    t.end()
  }, options);

})

test('will unlink a named package', function(t) {
  var options = {
    recursive: false,
    cwd: path.resolve(process.cwd(), namedPackagePath),
    packages: ['namedProj1']
  }

  linklocal.unlink.named(PKG_DIR, function testLinked(err, linked) {
    t.ifError(err)
    linklocal.unlink(PKG_DIR, function testUnlinked(err, unlinked) {
      t.ok(unlinked)
      t.end()
    })
  }, options)

})