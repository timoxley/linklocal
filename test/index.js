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

test('test is running on npm > 2.0.0', function(t) {
  exec('npm -v', {cwd: PKG_DIR}, function(err, version) {
    t.ok(version[0] >= '2')
    t.end()
  })
})

test('can swap local packages for links', function(t) {
  setup()
  exec('npm install', {cwd: PKG_DIR}, function(err) {
    t.ifError(err)
    linklocal(PKG_DIR, function(err, linked) {
      t.ifError(err)
      t.deepEqual(linked.map(getLink).sort(), LINKS)
      LINKS.forEach(function(link) {
        var exists = fs.existsSync(link)
        t.ok(exists, 'exists')
        if (!exists) return
        var stat = fs.lstatSync(link)
        t.ok(stat.isSymbolicLink(), 'is symbolic link')
      })
      t.end()
    })
  })
})

test('can unlink local packages', function(t) {
  setup()
  linklocal(PKG_DIR, function testLinked(err, linked) {
    t.ifError(err)
    t.deepEqual(linked.map(getLink).sort(), LINKS)
    linklocal.unlink(PKG_DIR, function testUnlinked(err, unlinked) {
      t.ifError(err)
      t.deepEqual(unlinked.map(getLink).sort(), LINKS)
      LINKS.forEach(function eachLink(link) {
        t.notOk(fs.existsSync(link))
      })
      t.end()
    })
  })
})

test('unlink ignores if package not linked', function(t) {
  setup()
  linklocal(PKG_DIR, function(err, linked) {
    t.ifError(err)
    var links = linked.map(getLink).sort()
    t.deepEqual(links, LINKS)
    fs.unlink(links[0])
    linklocal.unlink(PKG_DIR, function(err, linked) {
      t.ifError(err)
      var expected = LINKS.slice(1)
      t.deepEqual(linked.map(getLink).sort(), expected)
      expected.forEach(function(link) {
        t.notOk(fs.existsSync(link))
      })
      t.end()
    })
  })
})

test('can handle zero dependencies', function(t) {
  setup()
  var PKG_DIR = path.resolve(__dirname, 'empty')
  linklocal(PKG_DIR, function(err, linked) {
    t.ifError(err)
    t.ok(linked)
    t.deepEqual(linked, [])
    linklocal.unlink(PKG_DIR, function(err, unlinked) {
      t.ifError(err)
      t.deepEqual(linked, [])
      t.end()
    })
  })
})

function getLink(item) {
  return item.link
}
