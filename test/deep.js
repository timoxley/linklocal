'use strict'

var test = require('tape')

var path = require('path')
var rimraf = require('rimraf')

var linklocal = require('../')

var deep = path.resolve(__dirname, 'deep')
var deepA = path.resolve(deep, 'deep-a')
var deepB = path.resolve(deep, 'deep-b')
var deepC = path.resolve(deep, 'deep-c')
var deepD = path.resolve(deep, 'deep-d')

var expectedLinks = [
  path.resolve(deepA, 'node_modules/deep-b'),
  path.resolve(deepA, 'node_modules/deep-c'),
  path.resolve(deepB, 'node_modules/deep-d'),
  path.resolve(deepC, 'node_modules/deep-d'),
  path.resolve(deepD, 'node_modules/deep-a'),
  path.resolve(deep, 'node_modules/deep-a')
]

function setup () {
  rimraf.sync(path.resolve(deep, 'node_modules'))
  rimraf.sync(path.resolve(deepA, 'node_modules'))
  rimraf.sync(path.resolve(deepB, 'node_modules'))
  rimraf.sync(path.resolve(deepC, 'node_modules'))
  rimraf.sync(path.resolve(deepD, 'node_modules'))
}

test('can link deep', function (t) {
  setup()
  linklocal.recursive(deep, function (err, linked) {
    t.ifError(err)
    t.ok(linked)
    t.deepEqual(linked.map(getFrom).sort(), expectedLinks.sort())
    t.end()
  })
})

test('can unlink nested', function (t) {
  setup()
  linklocal.recursive(deep, function (err, linked) {
    t.ifError(err)
    t.ok(linked)
    linklocal.unlink.recursive(deep, function (err, linked) {
      t.ifError(err)
      t.ok(linked)
      t.deepEqual(linked.map(getFrom).sort(), expectedLinks.sort())
      t.end()
    })
  })
})

function getFrom (item) {
  return item.from
}
