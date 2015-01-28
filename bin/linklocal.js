#!/usr/bin/env node

var path = require('path')
var linklocal = require('../')
var program = require('commander')
var pkg = require('../package.json')

program
  .version(pkg.version)
  .option('-u, --unlink', 'Unlink local dependencies')
  .option('-l, --link', 'Link local dependencies [default]')
  .option('--list', 'List all local dependencies regardless whether they are linked or not.')
  .option('-r, --recursive', 'Link recursively')
  .option('-f, --format [format]', 'output format', String, '%h')
  .option('--links', 'Output only symlinks (--format="%s")')
  .option('--files', 'Output only symlink targets (--format="%h") [default]')
  .option('--long', 'Output the symlink to hardlink mapping (--format="%s -> %h")')
  .option('--absolute', 'Format output paths as absolute paths')
  .option('-q, --unique', 'Only unique lines of output')
  .option('--no-summary', 'Exclude summary i.e. "Listed 22 dependencies"')
  .usage('[options] <dir>')

program.on('--help', function(){
  console.info('  Examples')
  console.info('')
  console.info('    $ linklocal                 # link local deps in current dir')
  console.info('    $ linklocal link            # link local deps in current dir')
  console.info('    $ linklocal -r              # link local deps recursively')
  console.info('    $ linklocal unlink          # unlink only in current dir')
  console.info('    $ linklocal unlink -r       # unlink recursively')
  console.info('')
  console.info('    $ linklocal list            # list all local deps, ignores link status')
  console.info('    $ linklocal list -r         # list all local deps recursively, ignoring link status')
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

if (program.list) command = 'list'

program.args[0] = program.args[0] || ''

var dir = path.resolve(process.cwd(), program.args[0]) || process.cwd()
var pkg = path.resolve(dir, 'package.json')
var recursive = !!program.recursive

fn = linklocal[command]
if (recursive) fn = fn.recursive

var format = ''
if (program.files) format = '%h'
if (program.links) format = '%s'
if (program.long) format = '%s -> %h'
if (!format) format = program.format

if (program.absolute) format = format.toUpperCase()

fn(dir, function(err, items) {
  if (err) throw err
  items = items || []
  var formattedItems = getFormattedItems(items, format)
  .filter(Boolean)

  if (program.unique) {
    formattedItems = formattedItems.filter(function(item, index, arr) {
      // uniqueness
      return arr.lastIndexOf(item) === index
    })
  }

  formattedItems.forEach(function(str) {
    console.log('%s', str)
  })

  summary(command, program.list ? formattedItems: items)
})

var formats = {
  '%S': function(obj) {
    return obj.from
  },
  '%H': function(obj) {
    return obj.to
  },
  '%s': function(obj) {
    return path.relative(process.cwd(), obj.from)
  },
  '%h': function(obj) {
    return path.relative(process.cwd(), obj.to)
  }
}

function getFormattedItems(items, format) {
  return items.map(function(item) {
    return formatOut(item, format)
  })
}

function formatOut(input, format) {
  var output = format
  for (var key in formats) {
    output = output.replace(new RegExp(key, 'gm'), formats[key](input))
  }
  return output
}

function summary(commandName, items) {
  if (!program['summary']) return
  var length = items.length
  var commandName = command[0].toUpperCase() + command.slice(1)
  console.error('\n%sed %d dependenc' + (1 == length ? 'y' : 'ies'), commandName, length)
}
