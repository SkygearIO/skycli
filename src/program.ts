export function programPath(): string {
  // NOTE(program-path): This function can determine
  // the path to the current program in the following cases.
  //
  // 1. node skycli.js
  // 2. ./skycli.js
  // 3. skycli
  // 4. ./node_modules/.bin/skycli
  //
  // For the first two cases,
  // process.argv should look like
  // ["/path/to/node", "/path/to/skycli.js"]
  // Since skycli.js has shebang and is executable,
  // so the program path is simply process.argv[1].
  //
  // For the last two cases,
  // process.argv should look like
  // ["/path/to/skycli", "/snapshot/skycli.js"]
  // Note that /snapshot is a path in the bundled file system,
  // so the program path is simply process.argv[0].
  //
  // So the problem has been reduced to detecting
  // whether the program is packaged by pkg or not.
  // To do this, we introduced a BUILD time variable process.env.PKG
  // with the help of rollup.
  if (process.env.PKG === "true") {
    return process.argv[0];
  }
  return process.argv[1];
}
