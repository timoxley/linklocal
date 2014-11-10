"use strict"

var fs = require('fs')
var path = require("path")
var debug = require('debug')('linklocal')
var once = require('once')
var mkdirp = require('mkdirp')
var rimraf = require('rimraf')
var assert = require('assert')

var linklocal = module.exports = function linklocal(dirpath, pkgpath, done) {
  if (arguments.length === 2) {
    done = pkgpath
    pkgpath = path.resolve(dirpath, 'package.json')
    return linklocal(dirpath, pkgpath, done)
  }
  assert.equal(typeof dirpath, 'string', 'dirpath should be a string')
  assert.equal(typeof pkgpath, 'string', 'pkgpath should be a string')
  assert.equal(typeof done, 'function', 'done should be a function')

  done = once(done)
  var node_modules = path.join(
    path.resolve(dirpath),
    'node_modules'
  )
  var locals = getLocals(dirpath, pkgpath) || []
  doLink(locals, node_modules, done)
}

module.exports.link = module.exports

module.exports.link.recursive = function linklocalRecursive(dirpath, pkgpath, done) {
  if (arguments.length === 2) {
    done = pkgpath
    pkgpath = path.resolve(dirpath, 'package.json')
    return linklocal.recursive(dirpath, pkgpath, done)
  }
  assert.equal(typeof dirpath, 'string', 'dirpath should be a string')
  assert.equal(typeof pkgpath, 'string', 'pkgpath should be a string')
  assert.equal(typeof done, 'function', 'done should be a function')

  done = once(done)
  var allLinkedDirs = []

  _linklocalRecursive(pkgpath, function(err) {
    done(err, allLinkedDirs)
  })

  function _linklocalRecursive(pkgpath, done) {
    _linklocal(pkgpath, function(err, linkedDirs) {
      if (err) return done(err)
      linkedDirs = linkedDirs || []
      var pending = linkedDirs.length
      if (!pending) return done(null)
      linkedDirs.forEach(function(linkedDir) {
        allLinkedDirs.push(linkedDir)
        _linklocalRecursive(path.resolve(linkedDir, 'package.json'), function(err) {
          if (err) return done(err)
          if (!--pending) return done(null)
        })
      })
    })
  }

}

function _linklocal(pkgpath, done) {
  assert.equal(typeof pkgpath, 'string', 'pkgpath should be a string')
  assert.equal(typeof done, 'function', 'done should be a function')
  done = once(done)
  var realPkgPath = fs.realpathSync(path.dirname(pkgpath))
  linklocal(realPkgPath, pkgpath, function(err, linkedDirs) {
    if (err) return done(err)
    done(null, linkedDirs)
  })
}

module.exports.unlink = function unlinklocal(dirpath, pkgpath, done) {
  if (arguments.length === 2) {
    done = pkgpath
    pkgpath = path.resolve(dirpath, 'package.json')
    return unlinklocal(dirpath, pkgpath, done)
  }
  assert.equal(typeof dirpath, 'string', 'dirpath should be a string')
  assert.equal(typeof pkgpath, 'string', 'pkgpath should be a string')
  assert.equal(typeof done, 'function', 'done should be a function')

  done = once(done)
  var node_modules = path.join(
    path.resolve(dirpath),
    'node_modules'
  )
  var locals = getLocals(dirpath, pkgpath) || []
  doUnlink(locals, node_modules, done)
}

module.exports.unlink.recursive = function unlinklocalRecursive(dirpath, pkgpath, done) {
  if (arguments.length === 2) {
    done = pkgpath
    pkgpath = path.resolve(dirpath, 'package.json')
    return linklocal.unlink.recursive(dirpath, pkgpath, done)
  }
  assert.equal(typeof dirpath, 'string', 'dirpath should be a string')
  assert.equal(typeof pkgpath, 'string', 'pkgpath should be a string')
  assert.equal(typeof done, 'function', 'done should be a function')

  done = once(done)
  var allLinkedDirs = findLinks(pkgpath, fs.realpathSync(pkgpath))
  .map(function(link) {
    return path.join(fs.realpathSync(path.dirname(link)), path.basename(link))
  })
  var sortedDirs = allLinkedDirs
  // sort in valid removal order
  .sort(function(dirA, dirB) {
    if (dirA === dirB) return 0
    if (dirB.indexOf(dirA) === 0) return 1
    return -1
  })
  sortedDirs.forEach(function(dir) {
    fs.unlinkSync(dir)
  })

  done(null, allLinkedDirs)

  function findLinks(pkgpath, realPath) {
    var links = []
    assert.equal(typeof pkgpath, 'string', 'pkgpath should be a string')
    done = once(done)

    var pkgDirpath = path.dirname(pkgpath)
    var realDirpath = fs.realpathSync(path.dirname(realPath))
    var node_modules = path.join(
      path.resolve(pkgDirpath),
      'node_modules'
    )

    var linkedDirs = getLocals(realDirpath, pkgpath)
    .filter(function(dir) {
      return fs.existsSync(dir)
    }).map(function(dir) {
      var pkg = JSON.parse(fs.readFileSync(path.resolve(dir, 'package.json')))
      var name = pkg.name
      return path.join(node_modules, name)
    }).filter(function(dir) {
      return fs.existsSync(dir)
    }).forEach(function(dir) {
      links.push(dir)
      links = links.concat(findLinks(path.resolve(dir, 'package.json'), path.resolve(dir, 'package.json')))
    })
    return links
  }
}

function getLocals(dirpath, pkgpath) {
  assert.equal(typeof dirpath, 'string', 'dirpath should be a string')
  assert.equal(typeof pkgpath, 'string', 'pkgpath should be a string')
  var pkg = JSON.parse(fs.readFileSync(pkgpath))
  var deps = getDependencies(pkg)
  return Object.keys(deps).filter(function(name) {
    var val = deps[name]
    return isLocal(val)
  }).map(function(name) {
    var pkgPath = deps[name]
    pkgPath = pkgPath.replace(/^file:/g, '')
    return path.resolve(dirpath, pkgPath)
  })
}

function getDependencies(pkg) {
  var deps = pkg.dependencies || {}
  var devDependencies = pkg.devDependencies || {}
  for (var name in devDependencies) {
    deps[name] = devDependencies[name]
  }
  return deps
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
    fs.realpath(dir, function(err, dir) {
      if (err) return done(err)
      var pkg = require(path.resolve(dir, 'package.json'))
      var name = pkg.name
      var dest = path.join(node_modules, name)
      var rel = path.relative(path.dirname(dest), dir)
      mkdirp(path.dirname(dest), function(err) {
        if (err && err.code !== 'EEXISTS') return done(err)
        fs.realpath(dest, function(err, realPath) {
          if (err && err.code !== 'ENOENT') return done(err)
          if (realPath && dest !== realPath) {
            rel = path.relative(dest, dir)
            if (realPath === dir) return skip()
          }
          fs.lstat(dest, function(err, stat) {
            if (err && err.code === 'ENOENT') return link()
            if (err) return done(err)
            if (!stat.isSymbolicLink()) return rimraf(dest, link)
            fs.unlink(dest, link)
          })
        })
      })

      function link(err) {
        if (err) return done(err)
        fs.symlink(rel, dest, 'junction', bump)
      }

      function bump(err) {
        if (err) return done(err)
        fs.realpath(path.dirname(dest), function(err, realPath) {
          dests.push(dest)
          debug('Linked ' + name + ' into ./' + path.relative(process.cwd(), dest))
          if (!--pending) return done(null, dests)
        })
      }

      function skip(err) {
        if (err) return done(err)
        if (!--pending) return done(null, dests)
      }
    })
  })
}

function doUnlink(packages, node_modules, done) {
  packages = packages || []
  var pending = packages.length
  var dests = []
  if (!packages.length) return done(null, [])
  packages.forEach(function(dir) {
    fs.realpath(dir, function(err, dir) {
      if (err) return done(err)
      var pkg = require(path.resolve(dir, 'package.json'))
      var name = pkg.name
      var dest = path.join(node_modules, name)
      fs.lstat(dest, function(err, stat) {
        if (err && err.code === 'ENOENT') return bump()
        if (err) return done(err)
        if (!stat || !stat.isSymbolicLink()) return bump()
        fs.unlink(dest, function(err) {
          if (err) return done(err)
          fs.realpath(path.dirname(dest), function(err, realPath) {
            if (err) return done(err)
            dest = path.join(realPath, path.basename(dest))
            dests.push(dest)
            debug('Unlinked ' + name + ' from ./' + path.relative(process.cwd(), dest))
            bump()
          })
        })
      })

      function bump() {
        if (!--pending) return done(null, dests)
      }
    })
  })
}
