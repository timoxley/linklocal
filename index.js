"use strict"

var fs = require('fs')
var path = require("path")
var debug = require('debug')('linklocal')
var once = require('once')
var findup = require('findup')
var mkdirp = require('mkdirp')
var rimraf = require('rimraf')

module.exports = function linklocal(dirname, done) {
  done = once(done)
  findup(dirname, 'package.json', function(err, root) {
    if (err) return done(err)
    var node_modules = path.join(
      root = path.resolve(root || dirname),
      'node_modules'
    )
    var locals = getLocals(root) || []
    doLink(locals, node_modules, done)
  })
}
module.exports.link = module.exports
module.exports.unlink = function unlinklocal(dirname, done) {
  done = once(done)
  findup(dirname, 'package.json', function(err, root) {
    if (err) return done(err)
    var node_modules = path.join(
      root = path.resolve(root || dirname),
      'node_modules'
    )
    var locals = getLocals(root) || []
    doUnlink(locals, node_modules, done)
  })
}

function getLocals(dirname) {
  var pkg = require(path.join(dirname, 'package.json'))
  var deps = pkg.dependencies || []
  return Object.keys(deps).filter(function(name) {
    var val = deps[name]
    return isLocal(val)
  }).map(function(name) {
    var pkgPath = deps[name]
    pkgPath = pkgPath.replace(/^file:/g, '')
    return path.resolve(dirname, pkgPath)
  })
}


function isLocal(val) {
  return (
    val.indexOf('.') === 0 ||
    val.indexOf('/') === 0 ||
    val.indexOf('file:') === 0
  )
}

function doLink(packages, node_modules, done) {
  packages = packages || []
  var pending = packages.length
  var dests = []
  if (!packages.length) return done(null, [])
  packages.forEach(function(dir) {
    var pkg = require(path.resolve(dir, 'package.json'))
    var name = pkg.name
    var dest = path.join(node_modules, name)
    var rel  = path.relative(path.dirname(dest), dir)
    mkdirp(path.dirname(dest), function(err) {
      if (err && err.code !== 'EEXISTS') return done(err)
      fs.lstat(dest, function(err, stat) {
        if (err && err.code === 'ENOENT') return link()
        if (err) return done(err)
        if (!stat.isSymbolicLink()) return rimraf(dest, link)

        fs.unlink(dest, link)
      })
    })

    function link(err) {
      if (err) return done(err)
      fs.symlink(rel, dest, 'junction', bump)
    }

    function bump(err) {
      if (err) return done(err)
      dests.push(dest)
      debug('Linked ' + name + ' into ./' + path.relative(process.cwd(), dest))
      if (!--pending) return done(null, dests)
    }
  })
}

function doUnlink(packages, node_modules, done) {
  packages = packages || []
  var pending = packages.length
  var dests = []
  if (!packages.length) return done(null, [])
  packages.forEach(function(dir) {
    var pkg = require(path.resolve(dir, 'package.json'))
    var name = pkg.name
    var dest = path.join(node_modules, name)
    var rel  = path.relative(node_modules, dir)
    fs.lstat(dest, function(err, stat) {
      if (err && err.code === 'ENOENT') return bump()
      if (err) return done(err)
      if (!stat || !stat.isSymbolicLink()) return bump()
      fs.unlink(dest, function(err) {
        if (err) return done(err)
        debug('Unlinked ' + name + ' from ./' + path.relative(process.cwd(), dest))
        dests.push(dest)
        bump()
      })
    })

    function bump() {
      if (!--pending) return done(null, dests)
    }
  })
}
