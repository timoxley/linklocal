"use strict"

var test = require('tape')

var fs = require("fs")
var path = require('path')
var exec = require('child_process').exec
var rimraf = require('rimraf')

var linklocal = require("../")

var salad = path.resolve(__dirname, 'salad')
var saladModulesPath = path.resolve(salad, 'node_modules')
var bowl = path.resolve(saladModulesPath, 'bowl')
var bowlModulesPath = path.resolve(bowl, 'node_modules')

var bowlModules = [
  path.resolve(bowlModulesPath, '@nuts', 'almond'),
  path.resolve(bowlModulesPath, 'apple'),
  path.resolve(bowlModulesPath, 'banana'),
  path.resolve(bowlModulesPath, 'banana', 'node_modules', 'apple')
].sort()

function setup() {
  rimraf.sync(saladModulesPath)
}

test('can link nested', function(t) {
  setup()
  var PKG_PATH = path.resolve(__dirname, 'salad', 'package.json')
  var PKG_DIR = path.dirname(PKG_PATH)
  linklocal.recursive(PKG_DIR, PKG_PATH, function(err, linked) {
    t.ifError(err)
    t.ok(linked)

    var expectedLinks = bowlModules.concat(bowl)

    t.deepEqual(linked.sort(), expectedLinks.sort())

    var stat = fs.lstatSync(bowl)
    t.ok(stat.isSymbolicLink(), 'bowl is symbolic link')
    t.ok(fs.existsSync(bowl), 'bowl exists')

    bowlModules.forEach(function(bowlModule) {
      var stat = fs.lstatSync(bowlModule)
      t.ok(stat.isSymbolicLink(), 'is symbolic link')
      t.ok(fs.existsSync(bowlModule), 'exists')
    })
    t.end()
  })
})

test('can unlink nested', function(t) {
  setup()
  var PKG_PATH = path.resolve(__dirname, 'salad', 'package.json')
  var PKG_DIR = path.dirname(PKG_PATH)

  var expectedLinks = bowlModules.concat(bowl)

  linklocal.link.recursive(PKG_DIR, PKG_PATH, function(err, linked) {
    t.ifError(err)
    t.deepEqual(linked.sort(), expectedLinks.sort())

    linklocal.unlink.recursive(PKG_DIR, PKG_PATH, function(err, unlinked) {
      t.ifError(err)
      t.ok(unlinked)
      t.deepEqual(unlinked.sort(), expectedLinks.sort())
      t.notOk(fs.existsSync(bowl), 'bowl does not exist')

      bowlModules.forEach(function(bowlModule) {
        t.notOk(fs.existsSync(bowlModule), 'exists')
      })
      t.end()
    })
  })
})

test('can link no dependencies', function(t) {
  setup()
  var PKG_PATH = path.resolve(__dirname, 'empty', 'package.json')
  var PKG_DIR = path.dirname(PKG_PATH)
  linklocal.recursive(PKG_DIR, PKG_PATH, function(err, linked) {
    t.ifError(err)
    t.ok(linked)
    var expectedLinks = bowlModules.concat(bowl)
    t.deepEqual(linked, [])
    t.end()
  })
})

test('unlink can handle zero dependencies', function(t) {
  setup()
  var PKG_PATH = path.resolve(__dirname, 'empty', 'package.json')
  var PKG_DIR = path.dirname(PKG_PATH)

  linklocal.unlink.recursive(PKG_DIR, PKG_PATH, function(err, unlinked) {
    t.ifError(err)
    t.ok(unlinked)
    t.deepEqual(unlinked, [])
    t.end()
  })
})

test('unlink can handle not linked', function(t) {
  setup()
  var PKG_PATH = path.resolve(__dirname, 'salad', 'package.json')
  var PKG_DIR = path.dirname(PKG_PATH)

  linklocal.unlink.recursive(PKG_DIR, PKG_PATH, function(err, unlinked) {
    t.ifError(err)
    t.ok(unlinked)
    t.deepEqual(unlinked, [])
    t.end()
  })
})
