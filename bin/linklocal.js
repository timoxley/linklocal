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
  .usage('[options] <dir>')

program.on('--help', function(){
  console.info('  Examples:')
  console.info('')
  console.info('$ linklocal                 # link local deps in current dir')
  console.info('$ linklocal -r              # link local deps recursively')
  console.info('$ linklocal unlink          # unlink only in current dir')
  console.info('$ linklocal unlink -r       # unlink recursively')
  console.info('')
  console.info('$ linklocal -- mydir        # link local deps in mydir')
  console.info('$ linklocal unlink -- mydir # unlink local deps in mydir')

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

fn(dir, pkg, function(err, items) {
  if (err) throw err
  var commandName = command[0].toUpperCase() + command.slice(1)
  console.error('%sed %d dependenc' + (1 == items.length ? 'y' : 'ies'), commandName, items.length)
  items.forEach(function(item) {
    console.info('%sed %s', commandName, path.relative(process.cwd(), item))
  })
})
