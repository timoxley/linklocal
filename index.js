"use strict"

var fs = require('fs')
var path = require("path")
var debug = require('debug')('linklocal')
var once = require('once')
var mkdirp = require('mkdirp')
var rimraf = require('rimraf')
var assert = require('assert')
var map = require('map-limit')

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
  getLocals(dirpath, pkgpath, function(err, locals) {
    if (err) return done(err)
    doLink(locals, node_modules, done)
  })
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

  _linklocalRecursive(pkgpath, done)

  function _linklocalRecursive(pkgpath, done) {
    _linklocal(pkgpath, function(err, linkedDirs) {
      if (err) return done(err)
      linkedDirs = linkedDirs || []
      map(linkedDirs, 1, function(link, next) {
        _linklocalRecursive(path.resolve(link.src, 'package.json'), function(err, moreLinks) {
          if (err) return next(err)
          return next(null, [link].concat(moreLinks || []))
        })
      }, function(err, links) {
        if (err) return done(err)
        done(null, links.reduce(function(all, cur) {
          return all.concat(cur)
        }, []))
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

  getLocals(dirpath, pkgpath, function(err, locals) {
    if (err) return done(err)
    doUnlink(locals, node_modules, done)
  })
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
  findLinks(pkgpath, fs.realpathSync(pkgpath), function(err, links) {
    if (err) return done(err)
    map(links, Infinity, function(link, next) {
      fs.realpath(path.dirname(link), function(err, realPath) {
        if (err) return next(err)
        next(null, path.join(realPath, path.basename(link)))
      })
    }, function(err, links) {
      if (err) return done(err)
      links = links.filter(function(item, index, arr) {
        return arr.indexOf(item) === index
      })
      .sort(function(dirA, dirB) {
        if (dirA === dirB) return 0
        if (dirB.indexOf(dirA) === 0) return 1
        return -1
      })
      map(links, Infinity, function(item, next) {
        fs.lstat(item, function(err, stat) {
          if (err) return next(err)
          return next(null, stat.isSymbolicLink())
        })
      }, function(err, isSymbolicLink) {
        if (err) return done(err)
        var symlinks = links.filter(function(link, i) {
          return isSymbolicLink[i]
        })
        map(symlinks, Infinity, function(symlink, next) {
          fs.readlink(symlink, function(err, rel) {
            if (err) return next(err)
            var src = path.resolve(symlink, rel)
            fs.unlink(symlink, function(err) {
              if (err) return next(err)
              next(null, {src: src, link: symlink})
            })
          })
        }, done)
      })
    })
  })

  function findLinks(pkgpath, realPath, done) {
    assert.equal(typeof pkgpath, 'string', 'pkgpath should be a string')
    done = once(done)

    var pkgDirpath = path.dirname(pkgpath)
    var realDirpath = fs.realpathSync(path.dirname(realPath))
    var node_modules = path.join(
      path.resolve(pkgDirpath),
      'node_modules'
    )

    var links = []
    getLocals(realDirpath, pkgpath, function(err, locals) {
      if (err) return done(err)
      var pending = 0
      var links = locals.filter(function(dir) {
        return fs.existsSync(dir)
      }).map(function(dir) {
        var pkg = JSON.parse(fs.readFileSync(path.resolve(dir, 'package.json')))
        var name = pkg.name
        return path.join(node_modules, name)
      }).filter(function(dir) {
        return fs.existsSync(dir)
      })
      if (!links.length) return done(null, links)
      links.forEach(function(dir) {
        links.push(dir)
        pending++
        findLinks(path.resolve(dir, 'package.json'), path.resolve(dir, 'package.json'), function(err, subLinks) {
          if (err) return done(err)
          links = links.concat(subLinks)
          if (!--pending) return done(null, links)
        })
      })
    })
  }
}

function getLocals(dirpath, pkgpath, done) {
  fs.realpath(dirpath, function(err, dirpath) {
    if (err) return done(err)
    fs.realpath(pkgpath, function(err, pkgpath) {
      if (err) return done(err)
      assert.equal(typeof dirpath, 'string', 'dirpath should be a string')
      assert.equal(typeof pkgpath, 'string', 'pkgpath should be a string')
      var pkg = JSON.parse(fs.readFileSync(pkgpath))
      var deps = getDependencies(pkg)
      var locals = Object.keys(deps).filter(function(name) {
        var val = deps[name]
        return isLocal(val)
      }).map(function(name) {
        var pkgPath = deps[name]
        pkgPath = pkgPath.replace(/^file:/g, '')
        return path.resolve(dirpath, pkgPath)
      })
      done(null, locals)
    })
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
          dest = path.join(realPath, path.basename(dest))
          dests.push({link: dest, src: dir})
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
        fs.readlink(dest, function(err, src) {
          if (err) return done(err)
          fs.unlink(dest, function(err) {
            if (err) return done(err)
            fs.realpath(path.dirname(dest), function(err, realPath) {
              if (err) return done(err)
              dest = path.join(realPath, path.basename(dest))
              dests.push({link: dest, src: src})
              debug('Unlinked ' + name + ' from ./' + path.relative(process.cwd(), dest))
              bump()
            })
          })
        })
      })

      function bump() {
        if (!--pending) return done(null, dests)
      }
    })
  })
}
