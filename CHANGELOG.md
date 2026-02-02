# Changelog

All notable changes to this project will be documented in this file.

## [Unreleased] - 2026-02-02

- Migrate project to native ECMAScript Modules (`type: "module"`) and update `main` to `src/gimpparser.js`.
- Remove legacy Babel build step; source runs directly with `node`.
- Update example scripts to use project-relative paths and explicit `.js` imports.
- Add a simple ESM test suite and runner under `tests/`; added tests for all `examples/*.xcf` files.
- Add GitHub Actions CI workflow (`.github/workflows/nodejs.yml`) to run tests on push/PR.
- Remove unused dev deps (`jsonfile`, `mkdirp`) and tidy `package.json` scripts to use `node` + `nodemon` for local iteration.
- Fix ESM import resolution by adding explicit `.js` extension in `src/gimpparser.js` for `./lib/xcfcompositer.js`.

---

## 2026-02-02

- Commits (selection):
  - `42c1eeb` — AI Added more tests (expanded tests and fixed examples)
  - `a7f7e97` — AI added tests (test runner and additional test cases)
  - `e0905cb` — AI updated to latest Javascript (native ESM, package.json, example fixes)

- Summary of changes:
  - Migrated to native ESM: added `type: "module"`, updated `main` to `src/gimpparser.js`, and used explicit `.js` imports.
  - Replaced `lazy.js` usages with native array methods.
  - Added a simple ESM test suite and runner under `tests/`, covering all example XCF files.
  - Updated `examples/*` to use project-relative paths and `fs` for directory creation.
  - Added GitHub Actions workflow to run tests on push/PR.
  - Removed unused devDeps and cleaned up `package.json` scripts.
  - Updated `readme.md` and `.github/copilot-instructions.md` with new run/test instructions.

## 2023-03-14

- Update dependency versions and package hygiene (several package updates and maintenance commits).

## 2017-01-12

- Bumped package version and added example scripts.

## 2016-08-11 — 2016-07-24

- Added parsing of parasites and initial text-layer translation support.
- Fixed layer group name generation and other parsing bugs.
- Improvements to layer flattening and alpha handling.
- Added automatic image creation when no image instance is passed to the layer renderer.
- Formatting and parser property updates to improve compatibility.

For full commit history, see the git log.
