# rollup-plugin-module-replacement

[![Build Status](https://travis-ci.com/Acionyx/rollup-plugin-module-replacement.svg?branch=master)](https://travis-ci.com/Acionyx/rollup-plugin-module-replacement)
[![dependencies Status](https://david-dm.org/Acionyx/rollup-plugin-module-replacement/status.svg)](https://david-dm.org/Acionyx/rollup-plugin-module-replacement)
[![devDependencies Status](https://david-dm.org/Acionyx/rollup-plugin-module-replacement/dev-status.svg)](https://david-dm.org/Acionyx/rollup-plugin-module-replacement?type=dev)
[![Coverage Status](https://coveralls.io/repos/github/Acionyx/rollup-plugin-module-replacement/badge.svg?branch=master)](https://coveralls.io/github/Acionyx/rollup-plugin-module-replacement?branch=master)

Replace modules when bundling packages with Rollup.

This can be useful for allowing different behaviour between builds.

Plugin can be used for simple aliasing too.

Furthermore it provides a way to chain aliasing with any resolving plugin 
(like [`rollup-plugin-node-resolve`](https://www.npmjs.com/package/rollup-plugin-node-resolve)), see examples below.

Let's take a look at an example:

```javascript
// rollup.config.js

import replacement from "rollup-plugin-module-replacement";

const appTarget = process.env.APP_TARGET || "VERSION_A";

export default {
  // ...
  plugins: [
    replacement({
      entries: [
        {
          find: /(.*)-APP_TARGET(\.*)/,
          replacement: importee =>
            importee.replace(/-APP_TARGET/, `-${appTarget}`)
        }
      ]
    })
  ]
};
```

If `replacement` is a String, `find` will be simply replaced with it.
If `replacement` is a function, it is expected to return a String containing new path.

Plugin **does not make any resolve logic under the hood**. 
If you want files to be resolved with any plugin, see **Advanced usage** section below. 

For Webpack users: This is a plugin to basically mimic the [`NormalModuleReplacementPlugin`](https://www.npmjs.com/package/module-replace-webpack-plugin) functionality in Rollup.

## Installation

```
$ npm install --save-dev rollup-plugin-module-replacement
```

#

## Usage

```javascript
// rollup.config.js
import replacement from "rollup-plugin-module-replacement";

export default {
  // ...
  plugins: [
    replacement({
      entries: [
        {
          find: /(.*)-APP_TARGET(\.*)/,
          replacement: importee =>
            importee.replace(/-APP_TARGET/, `-${appTarget}`)
        }
      ]
    })
  ]
};
```

The order of the entries is important, in that the first rules are applied first.

You can use either simple Strings or Regular Expressions to search in a more distinct and complex manner (e.g. to do partial replacements via subpattern-matching, see aboves example).

## Advanced usage

In most situations you would like to keep preferred resolving method together with aliasing.
It is a common issue with plugins like [`rollup-plugin-alias`](https://www.npmjs.com/package/rollup-plugin-alias), because they do their resolve algorithm under the hood and it may not suit your needs.

So how to keep aliases together with your resolve algorithm like [`rollup-plugin-node-resolve`](https://www.npmjs.com/package/rollup-plugin-node-resolve)?

It is very easy to do, see example below.

```javascript
// rollup.config.js
import replacement from "rollup-plugin-module-replacement";
import resolve from "rollup-plugin-node-resolve";

const customResolver = resolve({
  extensions: [".mjs", ".js", ".jsx", ".json", ".sass", ".scss"]
}).resolveId;
const projectRootDir = path.resolve(__dirname);

export default {
  // ...
  plugins: [
    replacement({
      entries: [
        {
          find: "src",
          replacement: (importeeId, importerId) =>
            customResolver(
              importeeId.replace("src", path.resolve(projectRootDir, "src")),
              importerId
            )
        }
      ]
    }),
    resolve()
  ]
};
```

In exampled below we made an alias `src` and still keep node-resolve algorithm for your files that are "aliased" with `src`.
Also we keep `resolve()` plugin separately in plugins list for other files that are not aliased with `src`.

In same manner you can chain other plugins by using [`rollup-plugin-module-replacement`](https://www.npmjs.com/package/rollup-plugin-module-replacement) architecture.

## License

MIT, see `LICENSE` for more information
