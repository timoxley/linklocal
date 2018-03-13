
2.8.2 / 2018-03-13
==================

* Prevent busting exec buffer + speed up npm install step in test.
* Update dependencies.
* Fix tests for npm@^5. Hardcode npm@5.0.4 dep as npm >5 is broken.
* Linting.
* Readme.md grammar fix by @deltaskelta
* Add callback to fs.unlink by @BridgeAR
* Drop CI support for node 0.10 & 0.12, add support for node 9.

2.8.1 / 2017-07-04
==================

* Update dependencies & linting.
* Remove `npm cache clear` from travis CI setup.
* Update Readme.md via pull request #32 from tomazy
* Update Readme.md via pull request #29 from briandipalma

2.8.0 / 2017-01-04
==================

* Add Contributors to Readme
* Merge pull request #26 from bencripps/master
* Adding @scope functionality for --named function

2.7.0 / 2016-12-09
==================

* Add yarn.lock.
* Use caret instead of tilde for dependencies.
* Update devDependencies.
* Merge pull request #27 from jalex/master
* Fix #22 - Always use Junctions on Windows

2.6.1 / 2016-09-14
==================

  * Update and tweak --help text.
  * Use standard style.
  * Add code coverage report.
  * Update dependencies.

2.6.0 / 2016-02-23
==================

  * Merge pull request #25 from bencripps/master
  * Added linklocal.name, .nameRecursive, name.unlink, and name.unLinkRecursive. Updated readme. Added tests for new functionality.
  * See if intermittent build failure still occurs on dist: trusty.
  * Clear npm cache before running travis tests.
  * Merge pull request #21 from mikaelbr/ignoreLocalPacks
  * Fix issue with having local npm packed modules
  * Update dependencies.
  * Merge pull request #19 from timoxley/docs-shell
  * Make example portable
  * Attempt to fix build on travis. npm bug prevails.
  * Update travis node targets.

2.5.2 / 2015-05-14
==================

  * Update dependencies.
  * Merge pull request #17 from crcn/patch-1
  * fix typo
  * Add node.ico badges.

2.5.1 / 2015-03-10
==================

  * deps: pin commander to 2.6.x - Yoshua Wuyts.
  * Update Readme.md
  * Add references to local deps docs in npm.

2.5.0 / 2015-01-28
==================

  * Add --no-summary option.
  * Sort options alphabetically.
  * Update tape to 3.4.0, make tests pretty with tap-spec.

2.4.3 – 2.4.4 / 2015-01-02
==========================

  * Update commander from 2.5.0 to 2.6.0.
  * Indicate source file for JSON parse errors.

2.4.2 / 2014-12-11
==================

  * Update dependencies.
  * Absolute junctions for winxp - Vincent Weevers.
  * Add travis CI badge.

2.4.1 / 2014-11-24
==================

  * Fix issue with duplicated deep links.

2.4.0 / 2014-11-20
==================

  * Massive refactoring.
  * Add list command
  * Add new formatting aliases.
  * Fix bulk example - Yoshua Wuyts.

2.3.0 - 2.3.1 / 2014-11-12
==========================

  * Update docs.
  * Add relative/absolute format tokens.
  * Fix linklocal unlink destination paths.

2.2.0 - 2.2.1 / 2014-11-12
==========================

  * Improve recursive linking.
  * Add --format.

2.1.0 - 2.1.3 / 2014-11-10
==========================

  * Deal with long paths from circular dependencies during unlink.
  * Ensure we've found a symbolic link before attempting removal.
  * Resolve minimal linkage before unlinking.
  * Handle circular dependencies.
  * Normalize link output to minimum linkage.

2.0.1 / 2014-09-22
==================

  * bin: update console message

2.0.0 / 2014-09-22
==================

  * Link production and development dependencies.

1.1.2 / 2014-09-22
==================

  * Bugfix.

1.1.1 / 2014-09-22
==================

  * Update documentation to include recursion.

1.1.0 / 2014-09-22
==================

  * Add recursive linking/unlinking.

1.0.2 / 2014-09-21
==================

  * Add total links/unlinks to output.

1.0.1 / 2014-09-21
==================

  * Fix broken executable. #1

1.0.0 / 2014-09-20
==================

  * Initial Release.
