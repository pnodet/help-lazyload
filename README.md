# help-lazyload
> Small lazy loader js package I use to help me

[![XO code style](https://img.shields.io/badge/code_style-XO-5ed9c7.svg)](https://github.com/xojs/xo)
[![GitHub workflow status](https://img.shields.io/github/workflow/status/pnxdxt/help-lazyload/CI)](https://github.com/pnxdxt/help-lazyload)
[![npm bundle size](https://img.shields.io/bundlephobia/min/help-lazyload)](https://bundlephobia.com/package/help-lazyload)
[![npm downloads](https://img.shields.io/npm/dt/help-lazyload)](https://www.npmjs.com/package/help-lazyload)

## Install
```
$ npm install help-lazyload
```
## Import

This package is pure [ESM](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Guide/Modules). It cannot be `require()`'d from CommonJS.

Use `import foo from 'foo'` instead of `const foo = require('foo')` to import the package.

```js
// Load entire build
import lazyLoad from 'help-lazyload';
```
If the package is used in an async context, you could use [`await import(…)`](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Statements/import#dynamic_imports) from CommonJS instead of `require(…)`.

**You also need to make sure you're on the latest minor version of Node.js. At minimum Node.js 12.20, 14.14, or 16.0.**

Read more here: [sindresorhus/esm-package](https://gist.github.com/sindresorhus/a39789f98801d908bbc7ff3ecc99d99c)


## Usage

```js
lazyLoad()
```

## License

MIT © [Paul Nodet](https://pnodet.com)
