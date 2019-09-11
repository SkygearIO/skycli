import {
  readdir as readdirCB,
  lstat as lstatCB,
  readFile as readFileCB
} from 'fs';
import { promisify } from 'util';
import { join, relative } from 'path';
import zeitdockerignore from '@zeit/dockerignore';

const readdir = promisify(readdirCB);
const lstat = promisify(lstatCB);
const readFile = promisify(readFileCB);

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

// Same as walk except that if .dockerignore is found
// at the top-level, it is respected.
export async function dockerignore(
  dir: string,
  ignoreFile: string = '.dockerignore'
): Promise<string[]> {
  const pathnames = await walk(dir);
  try {
    const dockerignoreFile = await readFile(join(dir, ignoreFile));
    const ig = zeitdockerignore();
    ig.add(dockerignoreFile.toString());
    return pathnames.filter(ig.createFilter());
  } catch (e) {
    return pathnames;
  }
}

// Filter the paths with ignore file
export async function dockerignorePaths(
  paths: string[],
  ignoreFilePath: string
): Promise<string[]> {
  const dockerignoreFile = await readFile(ignoreFilePath);
  const ig = zeitdockerignore();
  ig.add(dockerignoreFile.toString());
  return paths.filter(ig.createFilter());
}
