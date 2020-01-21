import { ensureFile, readFile, writeFile } from "fs-extra";

import { tempPath } from "./path";

// cacheString first tries to read cache.
//
// If such cache is found, it then calls validate.
// Otherwise, it calls create, caches the result and returns it.
//
// If validate succeeds, the content is returned.
// Otherwise, it calls create, caches the result and returns it.
//
// Otherwise, it calls create, caches the result and returns it.
export async function cacheString(options: {
  create: () => Promise<string>;
  cacheKey: string;
  validate: (content: string) => Promise<void>;
}): Promise<string> {
  const { create, cacheKey, validate } = options;
  const cacheFilePath = tempPath(cacheKey);

  const fresh = async () => {
    const content = await create();
    try {
      await ensureFile(cacheFilePath);
      await writeFile(cacheFilePath, content, { encoding: "utf8" });
    } catch {}
    return content;
  };

  try {
    const content = await readFile(cacheFilePath, { encoding: "utf8" });
    try {
      await validate(content);
      return content;
    } catch {
      return fresh();
    }
  } catch {
    return fresh();
  }
}
