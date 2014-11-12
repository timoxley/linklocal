#!/usr/bin/env node

var path = require('path')
var linklocal = require('../')
var program = require('commander')
var pkg = require('../package.json')

program
  .version(pkg.version)
  .option('-u, --unlink', 'Unlink local dependencies')
  // ignore --link only for api balancing with unlink
  .option('-l, --link', 'Link local dependencies [default]')
  .option('-r, --recursive', 'Link recursively')
  .option('-f, --format [format]', 'output format', String, '%s -> %h')
  .usage('[options] <dir>')

program.on('--help', function(){
  console.info('  Examples')
  console.info('')
  console.info('    $ linklocal                 # link local deps in current dir')
  console.info('    $ linklocal -r              # link local deps recursively')
  console.info('    $ linklocal unlink          # unlink only in current dir')
  console.info('    $ linklocal unlink -r       # unlink recursively')
  console.info('')
  console.info('    $ linklocal -- mydir        # link local deps in mydir')
  console.info('    $ linklocal unlink -- mydir # unlink local deps in mydir')

  console.info('')
  console.info('  Formats')
  console.info('')
  console.info('    %s: relative path to symlink')
  console.info('    %S: absolute path to symlink')
  console.info('    %h: relative real path to symlink target')
  console.info('    %H: absolute real path to symlink target')
  console.info('')
  console.info('    relative paths are relative to cwd')
  console.info('')
})

program.parse(process.argv)

var command = program.unlink ? 'unlink' : 'link'

program.args[0] = program.args[0] || ''

var dir = path.resolve(process.cwd(), program.args[0]) || process.cwd()
var pkg = path.resolve(dir, 'package.json')
var recursive = !!program.recursive

fn = linklocal[command]
if (recursive) fn = fn.recursive

var format = program.format

fn(dir, pkg, function(err, items) {
  if (err) throw err
  items = items || []
  var commandName = command[0].toUpperCase() + command.slice(1)
  items.forEach(function(item) {
    console.log('%s', formatOut(item, format))
  })
  console.error('\n%sed %d dependenc' + (1 == items.length ? 'y' : 'ies'), commandName, items.length)
})

var formats = {
  '%S': function(obj) {
    return obj.link
  },
  '%H': function(obj) {
    return obj.src
  },
  '%s': function(obj) {
    return path.relative(process.cwd(), obj.link)
  },
  '%h': function(obj) {
    return path.relative(process.cwd(), obj.src)
  }
}

function formatOut(input, format) {
  var output = format
  for (var key in formats) {
    output = output.replace(new RegExp(key, 'gm'), formats[key](input))
  }
  return output
}
