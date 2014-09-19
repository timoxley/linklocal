# linklocal

### Create symlinks to your local dependencies.

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

This will copy the package into the target's node_module's hierarchy.

Any time you modify your local dependency, you must reinstall it
in the locations that depend on it. This is not ideal when changes
are rapid. By symlinking local dependencies while in development,
changes can be instantly consumed by dependees.

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

# License

MIT
