import { digestOfFilePath } from "./digest";

test("digestOfFilePath", async () => {
  expect(await digestOfFilePath("fixture/digest/file.txt")).toEqual(
    "sha256:c98c24b677eff44860afea6f493bbaec5bb1c4cbb209c6fc2bbb47f66ff2ad31"
  );
});
