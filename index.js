'use strict'

var fs = require('fs')
var path = require('path')
var mkdirp = require('mkdirp')
var rimraf = require('rimraf')
var assert = require('assert')
var map = require('map-limit')
var os = require('os')

// Use junctions on Windows
if (os.platform() === 'win32') {
  var symlinkType = 'junction'
} else {
  symlinkType = 'dir'
}

module.exports = function linklocal (dirpath, _done) {
  function done (err, items) {
    _done(err, items || [])
  }
  assert.equal(typeof dirpath, 'string', 'dirpath should be a string')
  assert.equal(typeof done, 'function', 'done should be a function')

  // please enjoy this pyramid
  readPackage(dirpath, function (err, pkg) {
    if (err) return done(err)
    getLinks(pkg, function (err, links) {
      if (err) return done(err)
      filterAllLinksToUnlink(links, function (err, toUnlink) {
        if (err) return done(err)
        unlinkLinks(toUnlink, function (err) {
          if (err) return done(err)
          linkLinks(links, function (err) {
            if (err) return done(err)
            done(null, links)
          })
        })
      })
    })
  })
}

module.exports.link = module.exports

module.exports.link.named = function (dirpath, done, options) {
  assert.equal(typeof dirpath, 'string', 'dirpath should be a string')
  assert.equal(typeof done, 'function', 'done should be a function')

  var getLinksFn = options.recursive ? getLinksRecursive : getLinks

  readPackage(dirpath, function (err, pkg) {
    if (err) return done(err)
    getLinksFn(pkg, function (err, links) {
      if (err) return done(err)
      filterAllLinksToUnlink(links, function (err, toUnlink) {
        if (err) return done(err)
        unlinkLinks(toUnlink, function (err) {
          if (err) return done(err)
          linkLinks(links, function (err) {
            if (err) return done(err)
            done(null, links)
          })
        })
      })
    }, options)
  })
}

module.exports.link.recursive = function linklocalRecursive (dirpath, done) {
  assert.equal(typeof dirpath, 'string', 'dirpath should be a string')
  assert.equal(typeof done, 'function', 'done should be a function')

  readPackage(dirpath, function (err, pkg) {
    if (err) return done(err)
    getLinksRecursive(pkg, function (err, links) {
      if (err) return done(err)
      filterAllLinksToUnlink(links, function (err, toUnlink) {
        if (err) return done(err)
        unlinkLinks(toUnlink, function (err) {
          if (err) return done(err)
          linkLinks(links, function (err) {
            if (err) return done(err)
            done(null, links)
          })
        })
      })
    })
  })
}

module.exports.unlink = function unlinklocal (dirpath, done) {
  readPackage(dirpath, function (err, pkg) {
    if (err) return done(err)
    getLinks(pkg, function (err, links) {
      if (err) return done(err)
      filterLinksToUnlink(links, function (err, toUnlink) {
        if (err) return done(err)
        unlinkLinks(toUnlink, function (err) {
          if (err) return done(err)
          done(null, toUnlink)
        })
      })
    })
  })
}

module.exports.unlink.named = function (dirpath, done, options) {
  var getLinksFn = options.recursive ? getLinksRecursive : getLinks

  readPackage(dirpath, function (err, pkg) {
    if (err) return done(err)
    getLinksFn(pkg, function (err, links) {
      if (err) return done(err)
      filterLinksToUnlink(links, function (err, toUnlink) {
        if (err) return done(err)
        unlinkLinks(toUnlink, function (err) {
          if (err) return done(err)
          done(null, toUnlink)
        })
      })
    }, options)
  })
}

module.exports.unlink.recursive = function unlinklocalRecursive (dirpath, done) {
  assert.equal(typeof dirpath, 'string', 'dirpath should be a string')
  assert.equal(typeof done, 'function', 'done should be a function')

  readPackage(dirpath, function (err, pkg) {
    if (err) return done(err)
    getLinksRecursive(pkg, function (err, links) {
      if (err) return done(err)
      filterLinksToUnlink(links, function (err, toUnlink) {
        if (err) return done(err)
        unlinkLinks(toUnlink, function (err) {
          if (err) return done(err)
          done(null, toUnlink)
        })
      })
    })
  })
}

module.exports.list = function list (dirpath, done) {
  readPackage(dirpath, function (err, pkg) {
    if (err) return done(err)
    getLinks(pkg, done)
  })
}

module.exports.list.recursive = function listRecursive (dirpath, done) {
  readPackage(dirpath, function (err, pkg) {
    if (err) return done(err)
    getLinksRecursive(pkg, done)
  })
}

function getLinksRecursive (pkg, done, options) {
  var _cache = _cache || {}

  return (function _getLinksRecursive (pkg, done) {
    if (_cache[pkg.dirpath]) return done(null, _cache[pkg.dirpath])
    getLinks(pkg, function (err, links) {
      _cache[pkg.dirpath] = _cache[pkg.dirpath] || []
      if (err) return done(err)
      _cache[pkg.dirpath] = _cache[pkg.dirpath].concat(links)
      map(links, Infinity, function (link, next) {
        readPackage(link.to, function (err, pkg) {
          if (err) return next(err)
          _getLinksRecursive(pkg, next)
        })
      }, done)
    }, options)
  })(pkg, function (err) {
    if (err) return done(err)
    var result = Object.keys(_cache).reduce(function (result, key) {
      return result.concat(_cache[key])
    }, [])
    result = uniqueKeys(result, 'from', 'to')
    return done(null, result)
  })
}

function getRealPaths (links, done) {
  map(links, Infinity, function (link, next) {
    fs.realpath(path.dirname(link), function (err, realPath) {
      if (err) return next(err)
      next(null, path.join(realPath, path.basename(link)))
    })
  }, function (err, links) {
    done(err, sortDirs(unique(links || [])))
  })
}

function readPackage (dirpath, done) {
  assert.equal(typeof dirpath, 'string', 'dirpath should be a string')
  var pkgpath = path.join(dirpath, 'package.json')
  fs.readFile(pkgpath, function (err, data) {
    if (err) return done(err)
    try {
      var pkg = JSON.parse(data)
    } catch (e) {
      return done(new Error('Error parsing JSON in ' + pkgpath + ':\n' + e.message))
    }
    pkg.dirpath = dirpath
    return done(null, pkg)
  })
}

function getLocalDependencies (pkg, done, options) {
  assert.equal(typeof pkg, 'object', 'pkg should be an object')
  var deps = getDependencies(pkg)
  var localDependencies = getPackageLocalDependencies(pkg, options)
  .map(function (name) {
    var pkgPath = deps[name]
    pkgPath = pkgPath.replace(/^file:/g, '')

    if (options && options.scopeRename) {
      return path.resolve(options.cwd, options.scopeRename)
    }

    if (options && options.packages.length > 0) {
      return path.resolve(options.cwd, name)
    }

    return path.resolve(pkg.dirpath, pkgPath)
  })

  getRealPaths(localDependencies, done)
}

function getPackageLocalDependencies (pkg, options) {
  assert.equal(typeof pkg, 'object', 'pkg should be an object')
  var deps = getDependencies(pkg)
  return Object.keys(deps).filter(function (name) {
    var dep = deps[name]
    return isLocalDependency(dep, name, options)
  })
}

function getDependencies (pkg) {
  var deps = pkg.dependencies || {}
  var devDependencies = pkg.devDependencies || {}
  for (var name in devDependencies) {
    deps[name] = devDependencies[name]
  }
  return deps
}

function isLocalDependency (val, name, options) {
  var ignoreExt = '.tgz'

  if (options && options.scopeRename && options.packages) {
    return isScopedDependency(name, options)
  }

  if (options && options.packages) {
    return options.packages.indexOf(name) !== -1
  }

  return (
    (val.indexOf('.') === 0 ||
     val.indexOf('/') === 0 ||
     val.indexOf('file:') === 0) &&
    val.lastIndexOf(ignoreExt) !== val.length - ignoreExt.length
  )
}

function getLinks (pkg, done, options) {
  getLocalDependencies(pkg, function (err, localDependencies) {
    if (err) return done(err)
    var destination = path.join(pkg.dirpath, 'node_modules')
    map(localDependencies, Infinity, readPackage, function (err, localDependencyPackages) {
      if (err) return done(err)
      var links = localDependencyPackages.map(function (localDependency) {
        return {
          from: path.resolve(destination, localDependency.name),
          to: localDependency.dirpath
        }
      })
      done(null, links)
    })
  }, options)
}

function isScopedDependency (name, options) {
  return name.indexOf('@') !== -1 && options.packages.indexOf(name) !== -1
};

function isSymbolicLink (filepath, done) {
  exists(filepath, function (err, doesExist) {
    if (err) return done(err)
    if (!doesExist) return done(null, false)
    fs.lstat(filepath, function (err, stat) {
      if (err) return done(err)
      return done(null, stat.isSymbolicLink())
    })
  })
}

function linksTo (from, to, done) {
  to = path.resolve(path.dirname(from), to)
  isSymbolicLink(from, function (err, isLink) {
    if (err) return done(err)
    if (!isLink) return done(null, false)
    fs.readlink(from, function (err, currentLink) {
      if (err) return done(err)
      currentLink = path.resolve(path.dirname(from), currentLink)
      return done(null, currentLink === to)
    })
  })
}

function filterLinksToUnlink (links, done) {
  links = uniqueKey(links, 'from')
  filter(links, Infinity, function (link, next) {
    linksTo(link.from, link.to, next)
  }, done)
}

function filterAllLinksToUnlink (links, done) {
  links = uniqueKey(links, 'from')
  filter(links, Infinity, function (link, next) {
    exists(link.from, function (err, ex) {
      next(err, ex)
    })
  }, function (err, toUnlink) {
    if (err) return done(err)
    return done(null, toUnlink)
  })
}

function linkLinks (links, done) {
  assert.ok(Array.isArray(links), 'links should be an array')
  map(links, Infinity, function (link, next) {
    mkdirp(path.dirname(link.from), function (err) {
      if (err && err.code !== 'EEXISTS') return next(err)

      var from = link.from
      var to = link.to

      // Junction points can't be relative
      if (symlinkType !== 'junction') {
        to = path.relative(path.dirname(from), to)
      }

      fs.symlink(to, from, symlinkType, function (err) {
        if (err) return next(new Error('Error linking ' + from + ' to ' + to + ':\n' + err.message))
        next(null, link)
      })
    })
  }, done)
}

function unlinkLinks (links, done) {
  assert.ok(Array.isArray(links), 'links should be an array')
  map(links, Infinity, function (link, next) {
    isSymbolicLink(link.from, function (err, isSymlink) {
      if (err) return next(err)
      var remove = isSymlink ? fs.unlink : rimraf
      return remove(link.from, function (err) {
        if (err) return next(new Error('Error removing ' + link.from + ':\n' + err.message))
        next(err, link)
      })
    })
  }, done)
}

function uniqueKeys (items, key1, key2) {
  var keys = [].slice.call(arguments, 1)
  return items.filter(function (item, index, arr) {
    return indexOf(items, function (otherItem) {
      return keys.every(function (key) {
        return item[key] === otherItem[key]
      })
    }) === index
  })
}

function indexOf (items, fn) {
  return items.reduce(function (foundIndex, item, index) {
    if (foundIndex !== -1) return foundIndex
    if (fn(item)) return index
    return foundIndex
  }, -1)
}

function uniqueKey (items, key) {
  var values = items.map(function (item) {
    return item[key]
  })
  values = unique(values)
  return items.filter(function (item) {
    if (!values.length) return
    var indexOfValue = values.indexOf(item[key])
    if (indexOfValue === -1) return false
    values.splice(indexOfValue, 1)
    return true
  })
}

function unique (arr) {
  return arr.filter(function (item, index, arr) {
    return arr.indexOf(item) === index
  })
}

function sortDirs (dirs) {
  return dirs.sort(function (dirA, dirB) {
    if (dirA === dirB) return 0
    if (dirB.indexOf(dirA) === 0) return 1
    return -1
  })
}

function filter (arr, num, filterFn, done) {
  map(arr, num, filterFn, function (err, matches) {
    return done(err, arr.filter(function (item, index) {
      return !!matches[index]
    }))
  })
}

function exists (filepath, done) {
  fs.lstat(filepath, function (err, stat) {
    if (err) {
      if (err.code !== 'ENOENT') return done(err)
      return done(null, false)
    }
    done(null, !!stat)
  })
}
