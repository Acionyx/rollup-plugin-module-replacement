import test from "ava";
import path from "path";
import { rollup } from "rollup";
import replacement from "../dist/rollup-plugin-module-replacement";

test("type", t => {
  t.is(typeof replacement, "function");
});

test("instance", t => {
  const result = replacement();
  t.is(typeof result, "object");
  t.is(typeof result.resolveId, "function");
});

test("defaults", t => {
  const result = replacement({});
  t.is(typeof result, "object");
  t.is(typeof result.resolveId, "function");
});

test("Simple replacement", t => {
  const result = replacement({
    entries: [
      { find: "foo", replacement: "bar" },
      { find: "pony", replacement: "paradise" },
      { find: "./local", replacement: "global" }
    ]
  });

  const resolved = result.resolveId("foo", "/src/importer.js");
  const resolved2 = result.resolveId("pony", "/src/importer.js");
  const resolved3 = result.resolveId("./local", "/src/importer.js");

  t.is(resolved, "bar");
  t.is(resolved2, "paradise");
  t.is(resolved3, "global");
});

test("RegExp replacement", t => {
  const result = replacement({
    entries: [
      { find: /f(o+)bar/, replacement: "f$1bar2019" },
      { find: new RegExp(".*pony.*"), replacement: "i/am/a/barbie/girl" },
      { find: /^test\/$/, replacement: "this/is/strict" }
    ]
  });

  const resolved = result.resolveId("fooooooooobar", "/src/importer.js");
  const resolved2 = result.resolveId(
    "im/a/little/pony/yes",
    "/src/importer.js"
  );
  const resolved3 = result.resolveId("./test", "/src/importer.js");
  const resolved4 = result.resolveId("test", "/src/importer.js");
  const resolved5 = result.resolveId("test/", "/src/importer.js");

  t.is(resolved, "fooooooooobar2019");
  t.is(resolved2, "i/am/a/barbie/girl");
  t.is(resolved3, null);
  t.is(resolved4, null);
  t.is(resolved5, "this/is/strict");
});

test("Will not confuse modules with similar names", t => {
  const result = replacement({
    entries: [
      { find: "foo", replacement: "bar" },
      { find: "./foo", replacement: "bar" }
    ]
  });

  const resolved = result.resolveId("foo2", "/src/importer.js");
  const resolved2 = result.resolveId("./fooze/bar", "/src/importer.js");
  const resolved3 = result.resolveId("./someFile.foo", "/src/importer.js");

  t.is(resolved, "bar2");
  t.is(resolved2, "barze/bar");
  t.is(resolved3, null);
});

test("Leaves entry file untouched if matches replacement", t => {
  const result = replacement({
    entries: [{ find: "abacaxi", replacement: "./abacaxi" }]
  });

  const resolved = result.resolveId("abacaxi/entry.js", undefined);

  t.is(resolved, null);
});

test("i/am/a/file", t => {
  const result = replacement({
    entries: [{ find: "resolve", replacement: "i/am/a/file" }]
  });

  const resolved = result.resolveId("resolve", "/src/import.js");

  t.is(resolved, "i/am/a/file");
});

test("Replacement function", t => {
  const result = replacement({
    entries: [{ find: "resolve", replacement: () => "newPath" }]
  });

  const resolved = result.resolveId("resolve", "/src/import.js");

  t.is(resolved, "newPath");
});

const getModuleIdsFromBundle = bundle => {
  if (bundle.modules) {
    return Promise.resolve(bundle.modules.map(module => module.id));
  }
  return bundle
    .generate({ format: "esm" })
    .then(generated => {
      if (generated.output) {
        return generated.output.length
          ? generated.output
          : Object.keys(generated.output).map(
            chunkName => generated.output[chunkName]
          );
      }
      return [generated];
    })
    .then(chunks =>
      chunks.reduce(
        (moduleIds, chunk) => moduleIds.concat(Object.keys(chunk.modules)),
        []
      )
    );
};

test("Works in rollup", t =>
  rollup({
    input: "./test/files/index.js",
    plugins: [
      replacement({
        entries: [
          { find: "fancyNumber", replacement: "./test/files/aliasMe.js" },
          {
            find: "./anotherFancyNumber",
            replacement: "./test/files/localAliasMe.js"
          },
          {
            find: "numberFolder",
            replacement: importee =>
              importee.replace(
                "numberFolder",
                "./test/files/folder"
              )
          },
          {
            find: "./numberFolder",
            replacement: () => "./test/files/folder/anotherNumber.js"
          }
        ]
      })
    ]
  })
    .then(getModuleIdsFromBundle)
    .then(moduleIds => {
      const normalizedIds = moduleIds.map(id => path.resolve(id)).sort();
      t.is(normalizedIds.length, 5);
      [
        "/files/aliasMe.js",
        "/files/folder/anotherNumber.js",
        "/files/index.js",
        "/files/localAliasMe.js",
        "/files/nonAliased.js"
      ]
        .map(id => path.normalize(id))
        .forEach((expectedId, index) =>
          t.is(
            normalizedIds[index].endsWith(expectedId),
            true,
            `expected ${normalizedIds[index]} to end with ${expectedId}`
          )
        );
    }));
