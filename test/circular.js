"use strict"

var test = require('tape')

var fs = require("fs")
var path = require('path')
var exec = require('child_process').exec
var rimraf = require('rimraf')

var linklocalBin = path.resolve(__dirname, '..', require('../package.json').bin['linklocal'])

var linklocal = require("../")

var PKG_A = path.resolve(__dirname, 'circular-a')
var PKG_B = path.resolve(__dirname, 'circular-b')
var PKG_C = path.resolve(__dirname, 'circular-c')

var A_TO_B = path.join(PKG_A, 'node_modules', 'circular-b')
var B_TO_C = path.join(PKG_B, 'node_modules', 'circular-c')
var C_TO_A = path.join(PKG_C, 'node_modules', 'circular-a')
var A_TO_B_TO_C = path.join(A_TO_B, 'node_modules', 'circular-c')
var A_TO_B_TO_C_TO_A = path.join(A_TO_B_TO_C, 'node_modules', 'circular-a')

var LINKS = Object.freeze([
  A_TO_B,
  B_TO_C,
  C_TO_A
].sort())

function setup() {
  rimraf.sync(path.resolve(PKG_A, 'node_modules'))
  rimraf.sync(path.resolve(PKG_B, 'node_modules'))
  rimraf.sync(path.resolve(PKG_C, 'node_modules'))
}

test('link circular dependencies recursive', function(t) {
  setup()
  linklocal.link.recursive(PKG_A, function(err, linked) {
    t.ifError(err)
    var expected = LINKS.slice()
    t.deepEqual(linked.map(getLink), expected)
    t.end()
  })
})

test('link circular dependencies recursive after install', function(t) {
  setup()
  exec('npm install', {cwd: PKG_A}, function(err) {
    t.ifError(err)
    linklocal.link.recursive(PKG_A, function(err, linked) {
      t.ifError(err)
      var expected = LINKS.slice()
      t.deepEqual(linked.map(getLink), expected)
      t.end()
    })
  })
})


test('link circular dependencies non-recursive', function(t) {
  setup()
  linklocal.link(PKG_A, function(err, linked) {
    t.ifError(err)
    t.deepEqual(linked.map(getLink), [A_TO_B])
    t.end()
  })
})

test('unlink circular dependencies not linked', function(t) {
  setup()
  linklocal.unlink.recursive(PKG_A, function(err, linked) {
    t.ifError(err)
    t.deepEqual(linked, [])
    t.end()
  })
})

test('unlink circular dependencies installed, not linked', function(t) {
  setup()
  exec('npm install', {cwd: PKG_A}, function(err) {
    linklocal.unlink.recursive(PKG_A, function(err, linked) {
      t.ifError(err)
      t.deepEqual(linked, [])
      t.end()
    })
  })
})

test('unlink circular dependencies recursive', function(t) {
  setup()
  linklocal.link.recursive(PKG_A, function(err, linked) {
    t.ifError(err)
    var expected = LINKS.slice()
    t.deepEqual(linked.map(getLink), expected)

    linklocal.unlink.recursive(PKG_A, function(err, linked) {
      t.ifError(err)
      var expected = LINKS.slice()
      t.deepEqual(linked.map(getLink), expected)
      t.end()
    })
  })
})

test('unlink circular dependencies recursive after install', function(t) {
  setup()
  exec('npm install', {cwd: PKG_A}, function(err) {
    t.ifError(err)
    linklocal.link.recursive(PKG_A, function(err, linked) {
      t.ifError(err)
      linklocal.unlink.recursive(PKG_A, function(err, linked) {
        t.ifError(err)
        var expected = LINKS.slice()
        t.deepEqual(linked.map(getLink), expected)
        t.end()
      })
    })
  })
})

test('unlink circular dependencies non-recursive', function(t) {
  setup()
  linklocal.link.recursive(PKG_A, function(err, linked) {
    t.ifError(err)
    linklocal.unlink(PKG_A, function(err, linked) {
      t.ifError(err)
      t.deepEqual(linked.map(getLink), [A_TO_B])
      t.end()
    })
  })
})

function getLink(item) {
  return item.from
}
