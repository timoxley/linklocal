#!/usr/bin/env node

var path = require('path')
var linklocal = require('../')
var program = require('commander')
var pkg = require('../package.json')

program
  .usage('[options] <dir>')
  .option('-f, --format [format]', 'output format', String, '%h')
  .option('-l, --link', 'Link local dependencies [default]')
  .option('-r, --recursive', 'Link recursively')
  .option('-q, --unique', 'Only unique lines of output')
  .option('-u, --unlink', 'Unlink local dependencies')
  .option('-n, --named', 'Link only named packages, last argument is cwd')
  .option('--absolute', 'Format output paths as absolute paths')
  .option('--files', 'Output only symlink targets (--format="%h") [default]')
  .option('--links', 'Output only symlinks (--format="%s")')
  .option('--list', 'Only list local dependencies. Does not link.')
  .option('--long', 'Output the symlink to hardlink mapping (--format="%s -> %h")')
  .option('--no-summary', 'Exclude summary i.e. "Listed 22 dependencies"')
  .version(pkg.version)

program.on('--help', function () {
  console.info('  Examples:')
  console.info('')
  console.info('    linklocal                                           # link local deps in current dir')
  console.info('    linklocal link                                      # link local deps in current dir')
  console.info('    linklocal -r                                        # link local deps recursively')
  console.info('    linklocal unlink                                    # unlink only in current dir')
  console.info('    linklocal unlink -r                                 # unlink recursively')
  console.info('')
  console.info('    linklocal list                                      # list all local deps, ignores link status')
  console.info('    linklocal list -r                                   # list all local deps recursively, ignoring link status')
  console.info('')
  console.info('    linklocal -- mydir                                  # link local deps in mydir')
  console.info('    linklocal unlink -- mydir                           # unlink local deps in mydir')
  console.info('    linklocal --named pkgname ../to/pkg                 # link local dep by name/path')
  console.info('    linklocal --named pkgname1 pkgname2 ../to/pkg       # link local deps by name/path')
  console.info('    linklocal unlink --named pkgname ../to/pkg          # unlink local dep by name/')
  console.info('    linklocal --named  -r pkgname ../to/pkg             # link local deps recursively by name/')
  console.info('')
  console.info('  Formats:')
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

var named = !!program.named
var dir = path.resolve(process.cwd(), program.args[0]) || process.cwd()
var recursive = !!program.recursive

var fn = linklocal[command]
if (recursive) fn = fn.recursive
if (named) {
  fn = linklocal[command].named
  dir = process.cwd()
}

var format = ''
if (program.files) format = '%h'
if (program.links) format = '%s'
if (program.long) format = '%s -> %h'
if (!format) format = program.format

if (program.absolute) format = format.toUpperCase()

var options = !named ? {} : {
  cwd: program.args[program.args.length - 1],
  packages: program.args.slice(0, program.args.length - 1),
  recursive: recursive
}

fn(dir, function (err, items) {
  if (err) throw err
  items = items || []
  var formattedItems = getFormattedItems(items, format)
  .filter(Boolean)

  if (program.unique) {
    formattedItems = formattedItems.filter(function (item, index, arr) {
      // uniqueness
      return arr.lastIndexOf(item) === index
    })
  }

  formattedItems.forEach(function (str) {
    console.log('%s', str)
  })

  summary(command, program.list ? formattedItems : items)
}, options)

var formats = {
  '%S': function (obj) {
    return obj.from
  },
  '%H': function (obj) {
    return obj.to
  },
  '%s': function (obj) {
    return path.relative(process.cwd(), obj.from)
  },
  '%h': function (obj) {
    return path.relative(process.cwd(), obj.to)
  }
}

function getFormattedItems (items, format) {
  return items.map(function (item) {
    return formatOut(item, format)
  })
}

function formatOut (input, format) {
  var output = format
  for (var key in formats) {
    output = output.replace(new RegExp(key, 'gm'), formats[key](input))
  }
  return output
}

function summary (commandName, items) {
  if (!program['summary']) return
  var length = items.length
  commandName = command[0].toUpperCase() + command.slice(1)
  console.error('\n%sed %d dependenc' + (length === 1 ? 'y' : 'ies'), commandName, length)
}
