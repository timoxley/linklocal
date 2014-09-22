"use strict"

var test = require('tape')

var fs = require("fs")
var path = require('path')
var exec = require('child_process').exec
var rimraf = require('rimraf')

var linklocal = require("../")

var NODE_MODULES = path.resolve(__dirname, 'salad', 'node_modules')

//var LINKS = Object.freeze([
  //path.join(NODE_MODULES, 'apple'),
  //path.join(NODE_MODULES, 'banana'),
//].sort())

function setup() {
  rimraf.sync(NODE_MODULES)
}

test('can link nested', function(t) {
  setup()
  var PKG_DIR = path.resolve(__dirname, 'salad')
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
