import { spawnSync } from "child_process";

import chalk from "chalk";

import { Arguments } from "../../util";

function requireKubectlVersion(
  expectedMajor: number,
  minimumMinor: number
): (argv: Arguments) => Promise<void> {
  return async function(_argv: Arguments): Promise<void> {
    const { stdout } = spawnSync(
      "kubectl",
      ["version", "--client", "--output", "json"],
      { encoding: "utf8" }
    );
    // The output looks like
    // {
    //   "clientVersion": {
    //     "major": "1",
    //     "minor": "17",
    //     "gitVersion": "v1.17.0",
    //     "gitCommit": "70132b0f130acc0bed193d9ba59dd186f0e634cf",
    //     "gitTreeState": "clean",
    //     "buildDate": "2019-12-13T11:51:44Z",
    //     "goVersion": "go1.13.4",
    //     "compiler": "gc",
    //     "platform": "darwin/amd64"
    //   }
    // }
    const output = JSON.parse(stdout);
    const actualMajor = parseInt(output.clientVersion.major, 10);
    const actualMinor = parseInt(output.clientVersion.minor, 10);
    if (actualMajor !== expectedMajor || actualMinor < minimumMinor) {
      throw chalk`{red ERROR:} expected kubectl version to be at least v${String(
        expectedMajor
      )}.${String(minimumMinor)}, but it is v${String(actualMajor)}.${String(
        actualMinor
      )}`;
    }
  };
}

export default requireKubectlVersion;
