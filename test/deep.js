"use strict"

var test = require('tape')

var fs = require("fs")
var path = require('path')
var exec = require('child_process').exec
var rimraf = require('rimraf')

var linklocal = require("../")

var deep = path.resolve(__dirname, 'deep')
var deepA = path.resolve(__dirname, 'deep-a')
var deepB = path.resolve(__dirname, 'deep-b')
var deepC = path.resolve(__dirname, 'deep-c')
var deepD = path.resolve(__dirname, 'deep-d')

var expectedLinks = [
  //path.resolve(banana, 'node_modules', 'apple'),
  //path.resolve(almond, 'node_modules', 'apple')
]

function setup() {
  rimraf.sync(path.resolve(deep, 'node_modules'))
  rimraf.sync(path.resolve(deepA, 'node_modules'))
  rimraf.sync(path.resolve(deepB, 'node_modules'))
  rimraf.sync(path.resolve(deepC, 'node_modules'))
  rimraf.sync(path.resolve(deepD, 'node_modules'))
}

test('can link deep', function(t) {
  setup()
  linklocal.recursive(deep, function(err, linked) {
    t.ifError(err)
    t.ok(linked)

    //var expectedLinks = bowlModules

    //t.deepEqual(linked.map(getLink).sort(), expectedLinks.sort())

    //var stat = fs.lstatSync(path.resolve(saladModulesPath, 'bowl'))
    //t.ok(stat.isSymbolicLink(), 'bowl is symbolic link')
    //t.ok(fs.existsSync(bowl), 'bowl exists')

    //bowlModules.forEach(function(bowlModule) {
      //var stat = fs.lstatSync(bowlModule)
      //t.ok(stat.isSymbolicLink(), 'is symbolic link')
      //t.ok(fs.existsSync(bowlModule), 'exists')
    //})
    t.end()
  })
})

test('can unlink nested', function(t) {
  setup()
  linklocal.recursive(deep, function(err, linked) {
    t.ifError(err)
    t.ok(linked)
    linklocal.unlink.recursive(deep, function(err, linked) {
      t.ifError(err)
      t.ok(linked)
      t.end()
    })
  })
})

    //var expectedLinks = bowlModules

    //t.deepEqual(linked.map(getLink).sort(), expectedLinks.sort())

    //var stat = fs.lstatSync(path.resolve(saladModulesPath, 'bowl'))
    //t.ok(stat.isSymbolicLink(), 'bowl is symbolic link')
    //t.ok(fs.existsSync(bowl), 'bowl exists')

    //bowlModules.forEach(function(bowlModule) {
      //var stat = fs.lstatSync(bowlModule)
      //t.ok(stat.isSymbolicLink(), 'is symbolic link')
      //t.ok(fs.existsSync(bowlModule), 'exists')
    //})
    //t.end()
  //})
  //var PKG_DIR = path.resolve(__dirname, 'salad')

  //var expectedLinks = bowlModules

  //linklocal.link.recursive(PKG_DIR, function(err, linked) {
    //t.ifError(err)
    //t.deepEqual(linked.map(getLink).sort(), expectedLinks.sort())
    //linklocal.unlink.recursive(PKG_DIR, function(err, unlinked) {
      //t.ifError(err)
      //t.ok(unlinked)
      //t.deepEqual(unlinked.map(getLink).sort(), expectedLinks.sort())
      //t.notOk(fs.existsSync(path.join(saladModulesPath, bowl)), 'bowl does not exist')

      //bowlModules.forEach(function(bowlModule) {
        //t.notOk(fs.existsSync(bowlModule), 'exists')
      //})
      //t.end()
    //})
  //})
//})
