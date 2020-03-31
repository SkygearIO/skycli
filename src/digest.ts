import { createHash } from "crypto";
import { createReadStream, ReadStream } from "fs";

export async function computeDigest(input: ReadStream): Promise<string> {
  const hash = await new Promise<Buffer>((resolve, reject) => {
    const hash = createHash("sha256");
    input.on("end", function () {
      hash.end();
      resolve(hash.read());
    });
    input.on("error", function (e) {
      reject(e);
    });
    input.pipe(hash);
  });

  return `sha256:${hash.toString("hex")}`;
}

export async function digestOfFilePath(p: string): Promise<string> {
  const input = createReadStream(p);
  try {
    return await computeDigest(input);
  } finally {
    input.close();
  }
}
