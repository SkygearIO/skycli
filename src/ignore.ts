import { readdir as readdirCB, lstat as lstatCB } from 'fs';
import { promisify } from 'util';
import { join, relative } from 'path';

const readdir = promisify(readdirCB);
const lstat = promisify(lstatCB);

// Walk the given directory and return pathnames that
// are relative to the directory. The file is either
// regular file or symlink.
export async function walk(dir: string): Promise<string[]> {
  const output = [];
  let input = [dir];
  while (input.length > 0) {
    const filePath = input.shift();
    if (filePath == null) {
      continue;
    }
    // eslint-disable-next-line no-await-in-loop
    const stats = await lstat(filePath);
    if (stats.isDirectory()) {
      // eslint-disable-next-line no-await-in-loop
      const basenames = await readdir(filePath);
      const filePaths = basenames.map((basename) => join(filePath, basename));
      input = input.concat(filePaths);
    } else if (stats.isFile() || stats.isSymbolicLink()) {
      output.push(filePath);
    }
  }
  return output.map((pathname) => relative(dir, pathname));
}
