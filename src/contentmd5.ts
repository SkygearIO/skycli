import { createHash } from "crypto";
import { createReadStream } from "fs";

export function md5OfFilePath(p: string): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    const hash = createHash("md5");
    const input = createReadStream(p);
    input.on("end", function() {
      hash.end();
      resolve(hash.read());
    });
    input.on("error", function(e) {
      reject(e);
    });
    input.pipe(hash);
  });
}

export function contentMD5OfMD5(md5: Buffer): string {
  return md5.toString("base64");
}

export async function contentMD5OfFilePath(p: string): Promise<string> {
  const md5 = await md5OfFilePath(p);
  return contentMD5OfMD5(md5);
}
