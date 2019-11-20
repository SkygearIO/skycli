import { contentMD5OfFilePath } from "./contentmd5";

test("contentMD5OfFilePath", async () => {
  expect(await contentMD5OfFilePath("fixture/contentmd5/file.txt")).toEqual(
    "vqglL/ToD0FxnqE83wBycw=="
  );
});
