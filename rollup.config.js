import { readFileSync, chmodSync } from "fs";

import babel from "rollup-plugin-babel";
import commonjs from "@rollup/plugin-commonjs";
import json from "@rollup/plugin-json";
import resolve from "@rollup/plugin-node-resolve";
import replace from "@rollup/plugin-replace";

const getBuiltins = require("builtins");
const semver = require("semver");

const pkg = require("./package.json");

const extensions = [".mjs", ".js", ".jsx", ".ts", ".tsx"];

const outputFile = "dist/skycli.js";

function pluginExecutable() {
  return {
    name: "plugin-executable",
    writeBundle() {
      chmodSync(outputFile, 0o755);
    },
  };
}

const plugins = [
  resolve({
    extensions,
  }),
  commonjs({
    include: "node_modules/**",
  }),
  replace({
    // NOTE(program-path): The environment variable PKG is a placeholder
    // to be replaced at BUILD time. It is used by a function to tell
    // the program path. See the comment in that for details.
    "process.env.PKG": JSON.stringify(
      process.env.PKG === "true" ? "true" : "false"
    ),
    "process.env.API_VERSION": JSON.stringify(
      `v${semver.major(pkg.version)}.${semver.minor(pkg.version)}`
    ),
  }),
  babel({
    extensions,
    exclude: "node_modules/**",
    runtimeHelpers: true,
  }),
  json({
    preferConst: true,
    indent: "  ",
  }),
  pluginExecutable(),
];

function makeExternal() {
  const jsonString = readFileSync("package.json", { encoding: "utf8" });
  const packageJSON = JSON.parse(jsonString);
  const deps = Object.keys(packageJSON["dependencies"] || {});
  const builtins = getBuiltins();

  function external(id) {
    return deps.indexOf(id) >= 0 || builtins.indexOf(id) >= 0;
  }

  return external;
}

export default {
  plugins,
  external: makeExternal(),
  input: "src/bin.ts",
  output: {
    file: outputFile,
    format: "cjs",
    banner: "#!/usr/bin/env node\n",
  },
};
