# linklocal

### Create symlinks to local dependencies in your package.json.

Requires npm 2.0.0 and above.

## Installation

```
npm install -g linklocal
```

## Usage

```
  Usage: linklocal [options] <dir>

  Options:

    -h, --help     output usage information
    -V, --version  output the version number
    -u, --unlink   Unlink local dependencies
    -l, --link     Link local dependencies [default]

  Examples:

    $ linklocal
    $ linklocal --unlink

    $ linklocal mydir
    $ linklocal --unlink mydir
```

### Linking

`linklocal` creates symlinks to any local dependencies it finds in your package.json.

```
> linklocal
link node_modules/apple
> ls -l node_modules
total 8
lrwxr-xr-x  1 timoxley  staff  11 20 Sep 01:39 apple -> ../apple
```

## Unlinking

You can unlink all local links using `linklocal --unlink`.

```
> linklocal --unlink
unlink node_modules/apple
> ls -l node_modules

>
```


## Why

npm 2.0.0 supports specifying local dependencies in your package.json:

```
> npm install --save ../apple
> cat package.json
{
  "name": "bowl",
  "version": "1.0.0",
  "dependencies": {
    "apple": "file:../apple"
  }
}
```

`npm install` will copy (and `npm install`) the package into the target's node_module's hierarchy.

This is not an ideal workflow during development as any time you modify your local dependency, you must reinstall it
in every location that depends on it. If you do not update all copies, you will have different versions of the same code, probably under the same version number.

Global `npm link` dependencies are also not ideal as packages clobber each other across projects.

By symlinking local dependencies while in development,
changes can be instantly consumed by dependees, effects
are limited to the current package and you can be more
certain local dependees are using the latest changes.

Note that `linklocal` does not run `npm install` for you.

## See Also

* [aperture](https://github.com/requireio/aperture)
* [district](https://github.com/hughsk/district)
* [symlink](https://github.com/clux/symlink)

# License

MIT
