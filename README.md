# rollup-plugin-module-replacement

Replace modules when bundling packages with Rollup.

This can be useful for allowing different behaviour between builds.

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

Plugin **does not make any resolve logic under the hood**. Be sure to include it into right place in `plugins` array (e.g. before all plugins that resolves files)

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

## License

MIT, see `LICENSE` for more information
