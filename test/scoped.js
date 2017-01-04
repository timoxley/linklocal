'use strict'

var test = require('tape')

var path = require('path')

var linklocal = require('../')
var scopedPackagePath = '@namespace/thing'

var PKG_DIR = path.resolve(__dirname, scopedPackagePath)

test('will link a scoped package', function (t) {
  var options = {
    recursive: false,
    cwd: path.resolve(process.cwd(), scopedPackagePath),
    scopeRename: 'thing',
    packages: ['@namespace/thing', 'thing']
  }

  linklocal.named(PKG_DIR, function (err, linked) {
    t.ifError(err)
    t.ok(linked)
    t.end()
  }, options)
})

test('will unlink a scoped package', function (t) {
  var options = {
    recursive: false,
    cwd: path.resolve(process.cwd(), scopedPackagePath),
    scopeRename: 'thing',
    packages: ['@namespace/thing', 'thing']
  }

  linklocal.unlink.named(PKG_DIR, function testLinked (err, linked) {
    t.ifError(err)
    linklocal.unlink(PKG_DIR, function testUnlinked (err, unlinked) {
      t.ifError(err)
      t.ok(unlinked)
      t.end()
    })
  }, options)
})
