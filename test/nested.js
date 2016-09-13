'use strict'

var test = require('tape')

var fs = require('fs')
var path = require('path')
var rimraf = require('rimraf')

var linklocal = require('../')

var salad = path.resolve(__dirname, 'salad')
var saladModulesPath = path.resolve(salad, 'node_modules')
var bowl = path.resolve(__dirname, 'bowl')
var bowlModulesPath = path.resolve(bowl, 'node_modules')
var banana = path.resolve(__dirname, 'banana')
var apple = path.resolve(__dirname, 'apple')
var almond = path.resolve(__dirname, 'almond')

var bowlModules = [
  path.resolve(saladModulesPath, 'bowl'),
  path.resolve(bowlModulesPath, '@nuts', 'almond'),
  path.resolve(bowlModulesPath, 'apple'),
  path.resolve(bowlModulesPath, 'banana'),
  path.resolve(banana, 'node_modules', 'apple'),
  path.resolve(almond, 'node_modules', 'apple')
]

function setup () {
  rimraf.sync(path.resolve(salad, 'node_modules'))
  rimraf.sync(path.resolve(bowl, 'node_modules'))
  rimraf.sync(path.resolve(apple, 'node_modules'))
  rimraf.sync(path.resolve(banana, 'node_modules'))
  rimraf.sync(path.resolve(almond, 'node_modules'))
}

test('can link nested', function (t) {
  setup()
  var PKG_DIR = path.resolve(__dirname, 'salad')
  linklocal.recursive(PKG_DIR, function (err, linked) {
    t.ifError(err)
    t.ok(linked)

    var expectedLinks = bowlModules

    t.deepEqual(linked.map(getLink).sort(), expectedLinks.sort())

    var stat = fs.lstatSync(path.resolve(saladModulesPath, 'bowl'))
    t.ok(stat.isSymbolicLink(), 'bowl is symbolic link')
    t.ok(fs.existsSync(bowl), 'bowl exists')

    bowlModules.forEach(function (bowlModule) {
      var stat = fs.lstatSync(bowlModule)
      t.ok(stat.isSymbolicLink(), 'is symbolic link')
      t.ok(fs.existsSync(bowlModule), 'exists')
    })
    t.end()
  })
})

test('can unlink nested', function (t) {
  setup()
  var PKG_DIR = path.resolve(__dirname, 'salad')

  var expectedLinks = bowlModules

  linklocal.link.recursive(PKG_DIR, function (err, linked) {
    t.ifError(err)
    t.deepEqual(linked.map(getLink).sort(), expectedLinks.sort())
    linklocal.unlink.recursive(PKG_DIR, function (err, unlinked) {
      t.ifError(err)
      t.ok(unlinked)
      t.deepEqual(unlinked.map(getLink).sort(), expectedLinks.sort())
      t.notOk(fs.existsSync(path.join(saladModulesPath, bowl)), 'bowl does not exist')

      bowlModules.forEach(function (bowlModule) {
        t.notOk(fs.existsSync(bowlModule), 'exists')
      })
      t.end()
    })
  })
})

test('can link no dependencies', function (t) {
  setup()
  var PKG_DIR = path.resolve(__dirname, 'empty')
  linklocal.recursive(PKG_DIR, function (err, linked) {
    t.ifError(err)
    t.ok(linked)
    t.deepEqual(linked, [])
    t.end()
  })
})

test('unlink can handle zero dependencies', function (t) {
  setup()
  var PKG_DIR = path.resolve(__dirname, 'empty')

  linklocal.unlink.recursive(PKG_DIR, function (err, unlinked) {
    t.ifError(err)
    t.ok(unlinked)
    t.deepEqual(unlinked, [])
    t.end()
  })
})

test('unlink can handle not linked', function (t) {
  setup()
  var PKG_DIR = path.resolve(__dirname, 'salad')

  linklocal.unlink.recursive(PKG_DIR, function (err, unlinked) {
    t.ifError(err)
    t.ok(unlinked)
    t.deepEqual(unlinked, [])
    t.end()
  })
})

function getLink (item) {
  return item.from
}
