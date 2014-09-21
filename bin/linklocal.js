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
  .usage('[options] <dir>')

program.on('--help', function(){
  console.log('  Examples:')
  console.log('')
  console.log('    $ linklocal')
  console.log('    $ linklocal --unlink')
  console.log('')
  console.log('    $ linklocal mydir')
  console.log('    $ linklocal --unlink mydir')
  console.log('')
})

program.parse(process.argv)

var command = program.unlink ? 'unlink' : 'link'

program.args[0] = program.args[0] || ''

var dir = path.resolve(process.cwd(), program.args[0]) || process.cwd()

linklocal[command](dir, function(err, items) {
  if (err) throw err
  var commandName = command[0].toUpperCase() + command.slice(1)
  console.error('%sed %d dependencies', commandName, items.length)
  items.forEach(function(item) {
    console.info('%sed %s', commandName, path.relative(process.cwd(), item))
  })
})
