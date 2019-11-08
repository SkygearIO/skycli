import { createFolderToPathsMapForArchive } from "./deploy";

test("createFolderToPathsMapForArchive with template", async () => {
  const result = await createFolderToPathsMapForArchive(
    {
      type: "http-service",
      context: "fixture/deploy/user_code",
      path: "",
      port: 8000,
    },
    "fixture/deploy/template"
  );

  for (const key of Object.keys(result)) {
    result[key] = result[key].sort();
  }

  const expected = {
    "fixture/deploy/user_code": [".skyignore", "src/index.js"],
    "fixture/deploy/template": [".dockerignore", "Dockerfile"],
  };
  expect(expected).toEqual(result);
});

test("createFolderToPathsMapForArchive should not provide .dockerignore with template", async () => {
  await expect(
    createFolderToPathsMapForArchive(
      {
        type: "http-service",
        context: "fixture/deploy/user_code_with_dockerignore",
        path: "",
        port: 8000,
      },
      "fixture/deploy/template"
    )
  ).rejects.toThrow(
    ".dockerignore is reserved file, please remove it from folder fixture/deploy/user_code_with_dockerignore"
  );
});

test("createFolderToPathsMapForArchive without template", async () => {
  const result = await createFolderToPathsMapForArchive(
    {
      type: "http-service",
      context: "fixture/deploy/user_code_with_dockerignore",
      path: "",
      port: 8000,
      dockerfile: "src/Dockerfile",
    },
    null
  );

  for (const key of Object.keys(result)) {
    result[key] = result[key].sort();
  }

  // skycli will not read `.skyignore`, if deploying docker
  const expected = {
    "fixture/deploy/user_code_with_dockerignore": [
      ".dockerignore",
      ".skyignore",
      "skyignored-file",
      "src/Dockerfile",
      "src/index.js",
    ],
  };
  expect(expected).toEqual(result);
});
