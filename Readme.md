# linklocal

### Create symlinks to local dependencies in your package.json.

Requires npm 2.0.0 and above.
Links both development and production dependencies.

## Installation

```
npm install -g linklocal
```

## Usage

```
  Usage: linklocal [options] <dir>

  Options:

    -h, --help      output usage information
    -V, --version   output the version number
    -u, --unlink    Unlink local dependencies
    -l, --link      Link local dependencies [default]
    -r, --recursive Link recursively [probably what you want]

  Examples:

    $ linklocal # link local deps in current dir
    $ linklocal -r # link local deps recursively
    $ linklocal unlink # unlink only in current dir
    $ linklocal unlink -r # unlink recursively

    $ linklocal -- mydir # link local deps in mydir
    $ linklocal unlink -- mydir # unlink local deps in mydir
```

### Linking

`linklocal` creates symlinks to any local dependencies it finds in your package.json.

```
# from test/banana
> linklocal
Linked 1 dependencies
Linked node_modules/apple
> ls -l node_modules
total 8
lrwxr-xr-x  1 timoxley  staff  11 20 Sep 01:39 apple -> ../../apple
```

## Unlinking

You can unlink all local links using `linklocal --unlink`.

```
# from test/banana
> linklocal --unlink
Unlinked 1 dependencies
Unlinked node_modules/apple
> ls -l node_modules

>
```

### Recursively Linking local dependencies in local dependencies

If your local dependencies might have local dependencies, you can use
`linklocal -r` to recursively link all local dependencies:

#### Without Recursion

`banana` depends on `apple`
`apple` does not get linked

```
# from test/bowl
> linklocal
Linked 3 dependencies
Linked node_modules/@nuts/almond
Linked node_modules/banana
Linked node_modules/apple
```
#### With Recursion

`apple` gets linked
```
# from test/bowl
> linklocal -r
Linked 4 dependencies
Linked node_modules/@nuts/almond
Linked node_modules/apple
Linked node_modules/banana
Linked node_modules/banana/node_modules/apple
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

## Recommendations

All local dependencies should have a `@scope`.
`linklocal` does not install dependencies of linked dependencies. To have them installed, use [hughsk/scoped-bulk](https://github.com/hughsk/scoped-bulk) in a script like:
```json
{
  "name": "my-app"
  "scripts": {
    "dev": "linklocal -r && scoped-bulk myscope npm install --production",
    "prepublish": "if [[ $NODE_ENV != 'production' ]]; then npm run dev; fi"
  }
}
```

## Caveats

* `linklocal` does not install dependencies of linked dependencies, as such you typically end up installing dependencies of linked dependencies twice: once during npm install, then again after linklocal

## See Also

* [aperture](https://github.com/requireio/aperture)
* [district](https://github.com/hughsk/district)
* [symlink](https://github.com/clux/symlink)

# License

MIT
