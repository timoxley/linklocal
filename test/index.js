"use strict"

var test = require('tape')

var fs = require("fs")
var path = require('path')
var exec = require('child_process').exec
var rimraf = require('rimraf')

var linklocal = require("../")

var PKG_DIR = path.resolve(__dirname, 'bowl')
var NODE_MODULES = path.resolve(__dirname, 'bowl', 'node_modules')

var LINKS = Object.freeze([
  path.join(NODE_MODULES, 'apple'),
  path.join(NODE_MODULES, 'banana'),
  path.join(NODE_MODULES, '@nuts', 'almond')
].sort())

function setup() {
  rimraf.sync(NODE_MODULES)
}

test('can swap local packages for links', function(t) {
  setup()
  exec('npm install', {cwd: PKG_DIR}, function(err) {
    t.ifError(err)
    linklocal(PKG_DIR, function(err, linked) {
      t.ifError(err)
      t.deepEqual(linked.sort(), LINKS)
      LINKS.forEach(function(link) {
        var stat = fs.lstatSync(link)
        t.ok(stat.isSymbolicLink(), 'is symbolic link')
        t.ok(fs.existsSync(link), 'exists')
      })
      t.end()
    })
  })
})

test('can unlink local packages', function(t) {
  setup()
  var PKG_DIR = path.resolve(__dirname, 'bowl')
  linklocal(PKG_DIR, function(err, linked) {
    t.ifError(err)
    t.deepEqual(linked.sort(), LINKS)
    linklocal.unlink(PKG_DIR, function(err, linked) {
      t.ifError(err)
      t.deepEqual(linked.sort(), LINKS)
      LINKS.forEach(function(link) {
        t.notOk(fs.existsSync(link))
      })
      t.end()
    })
  })
})

test('unlink ignores if package not linked', function(t) {
  setup()
  var PKG_DIR = path.resolve(__dirname, 'bowl')
  linklocal(PKG_DIR, function(err, linked) {
    t.ifError(err)
    t.deepEqual(linked.sort(), LINKS)
    fs.unlink(linked[0])
    linklocal.unlink(PKG_DIR, function(err, linked) {
      t.ifError(err)
      var expected = LINKS.slice(1)
      t.deepEqual(linked.sort(), expected)
      expected.forEach(function(link) {
        t.notOk(fs.existsSync(link))
      })
      t.end()
    })
  })
})
