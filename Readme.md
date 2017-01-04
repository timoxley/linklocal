# linklocal

### Create symlinks to local dependencies in your package.json.

`linklocal` is a development tool that the reduces overheads of breaking your application into small packages. It gives you more expressive power than simple files and folders, yet requires far less overhead than versioning and publishing packages to a local private registry.

Requires npm 2.0.0 and above in order for npm to recognise [local paths as dependencies](https://docs.npmjs.com/files/package.json#local-paths).

[![Build Status](https://travis-ci.org/timoxley/linklocal.svg?branch=master)](https://travis-ci.org/timoxley/linklocal)

[![NPM](https://nodei.co/npm-dl/linklocal.png?months=6&height=3)](https://nodei.co/npm-dl/linklocal/)
[![NPM](https://nodei.co/npm/linklocal.png?downloads=true&downloadRank=true&stars=true)](https://nodei.co/npm/linklocal/)

## Installation

```
npm install -g linklocal
```

## Usage

```
linklocal --help

  Usage: linklocal [options] <dir>

  Options:

    -h, --help             output usage information
    -f, --format [format]  output format
    -l, --link             Link local dependencies [default]
    -r, --recursive        Link recursively
    -q, --unique           Only unique lines of output
    -u, --unlink           Unlink local dependencies
    -n, --named            Link only named packages, last argument is cwd
    --absolute             Format output paths as absolute paths
    --files                Output only symlink targets (--format="%h") [default]
    --links                Output only symlinks (--format="%s")
    --list                 Only list local dependencies. Does not link.
    --long                 Output the symlink to hardlink mapping (--format="%s -> %h")
    --no-summary           Exclude summary i.e. "Listed 22 dependencies"
    -V, --version          output the version number

  Examples:

    linklocal                                                 # link local deps in current dir
    linklocal link                                            # link local deps in current dir
    linklocal -r                                              # link local deps recursively
    linklocal unlink                                          # unlink only in current dir
    linklocal unlink -r                                       # unlink recursively

    linklocal list                                            # list all local deps, ignores link status
    linklocal list -r                                         # list all local deps recursively, ignoring link status

    linklocal -- mydir                                        # link local deps in mydir
    linklocal unlink -- mydir                                 # unlink local deps in mydir
    linklocal --named pkgname ../to/pkg                       # link local dep by name/path
    linklocal --named pkgname1 pkgname2 ../to/pkg             # link local deps by name/path
    linklocal unlink --named pkgname ../to/pkg                # unlink local dep by name/
    linklocal --named -r pkgname ../to/pkg                    # link local deps recursively by name/
    linklocal --named -r @scope/pkgname pkgname ../to/pkg     # link local deps recursively by name/ with npm @scope

  Formats:

    %s: relative path to symlink
    %S: absolute path to symlink
    %h: relative real path to symlink target
    %H: absolute real path to symlink target

    relative paths are relative to cwd
```

## About

npm 2.0.0 [supports specifying local dependencies in your package.json](https://docs.npmjs.com/files/package.json#local-paths):

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

This is not an ideal workflow during development: any time you modify your local dependency, you must reinstall it
in every location that depends on it. If you do not update all copies, you will have different versions of the same code, probably under the same version number.

Global `npm link` dependencies are also not ideal as packages clobber each other across projects.

By symlinking local dependencies while in development,
changes can be instantly consumed by dependees, effects
are limited to the current package and you can be more
certain local dependees are using the latest changes.

`linklocal` symlinks both development and production dependencies, and ignores modules packed by NPM (`.tgz`).

## Examples

### Linking

`linklocal` creates symlinks to any local dependencies it finds in your package.json.

e.g. test/banana/package.json.

```json
{
  "name": "banana",
  "version": "1.0.0",
  "private": true,
  "dependencies": {
    "apple": "file:../apple"
  }
}
```
Note `file:` dependencies are [standard syntax in npm 2.x](https://docs.npmjs.com/files/package.json#local-paths), just that npm will copy the dependency into place, rather than symlink it. That's what `linklocal` is for:
```
# from test/banana
# find local dependencies and symlink them
> linklocal
node_modules/apple -> ../apple

Linked 1 dependency
> # proof:
> ls -l node_modules
total 8
lrwxr-xr-x  1 timoxley  staff  11 20 Sep 01:39 apple -> ../../apple
```

## Unlinking

You can unlink all local links using `linklocal --unlink`.

```
# from test/banana
> linklocal --unlink
node_modules/apple -> ../apple

Unlinked 1 dependency

> ls -l node_modules

>
```

### Recursively Linking local dependencies in local dependencies

If your local dependencies themselves might have local dependencies, you can use
`linklocal -r` to recursively link all local dependencies:

`bowl` depends on `banana`
`banana` depends on `apple`

#### With Recursion

`apple` gets linked into `banana`
```
node_modules/apple -> ../apple
node_modules/banana -> ../banana
../banana/node_modules/apple -> ../apple
node_modules/@nuts/almond -> ../almond

Linked 4 dependencies
```

#### Without Recursion

`apple` does not get linked into `banana`

```
# from test/bowl
> linklocal
node_modules/apple -> ../apple
node_modules/banana -> ../banana
node_modules/@nuts/almond -> ../almond

Linked 3 dependencies
```

#### Linking and Unlinking Packages by Name

```
# from test/named
> linklocal --named mypackagename ../
node_modules/mypackagename -> ../mypackagename

Linked 1 dependency
```

When linking local named packages, you may do so regularly or with recursion. The package names should be entered as an unordered list of strings, where the final argument is the relative path to where the source files for these packages are located.


## Recommendations

`linklocal` does not install dependencies of linked dependencies. To have dependencies installed, use [timoxley/bulk](https://github.com/timoxley/bulk) or `xargs` in a script like:
```json
{
  "name": "my-app",
  "scripts": {
    "dev": "linklocal link -r && linklocal list -r | bulk -c 'npm install --production'",
    "prepublish": "if [ \"$NODE_ENV\" != \"production\" ]; then npm run dev; fi"
  }
}
```

## Caveats

* `linklocal` does not install dependencies of linked dependencies, as such you typically end up installing dependencies of linked dependencies twice: once during npm install, then again after linklocal

## See Also

* [aperture](https://github.com/requireio/aperture)
* [district](https://github.com/hughsk/district)
* [symlink](https://github.com/clux/symlink)

## Contributors

```
111	Tim Oxley      90.2%
4	Yoshua Wuyts     3.3%
3	ben_cripps       2.4%
2	Vincent Weevers  1.6%
1	Craig Jefferds   0.8%
1	amalygin         0.8%
1	Mikael Brevik    0.8%
```

# License

MIT
