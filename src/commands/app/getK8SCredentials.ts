import { spawnSync } from "child_process";

import chalk from "chalk";
import { withFile } from "tmp-promise";
import { ensureFile, writeFile } from "fs-extra";

import { Arguments, createCommand } from "../../util";
import { programPath } from "../../program";
import { requireClusterConfig, requireUser, requireApp } from "../middleware";
import { cliContainer } from "../../container";

async function run(argv: Arguments) {
  await withFile(async ({ path }) => {
    const appName = argv.context.app ?? "";
    const { cluster_name } = await cliContainer.getClusterConfig();
    const contextName = `skygear-${cluster_name}-${appName}`;
    const {
      server,
      certificate_authority_data,
    } = await cliContainer.createServiceAccount(appName);

    let setClusterArgs = [
      "config",
      "set-cluster",
      contextName,
      "--server",
      server,
    ];
    if (certificate_authority_data != null) {
      await ensureFile(path);
      await writeFile(path, certificate_authority_data, { encoding: "base64" });
      setClusterArgs = setClusterArgs.concat([
        "--certificate-authority",
        path,
        "--embed-certs",
      ]);
    }

    spawnSync("kubectl", setClusterArgs);
    spawnSync("kubectl", [
      "config",
      "set-credentials",
      contextName,
      "--exec-command",
      programPath(),
      "--exec-api-version=client.authentication.k8s.io/v1beta1",
      "--exec-arg=--app",
      "--exec-arg",
      appName,
      "--exec-arg=app",
      "--exec-arg=get-k8s-token-request",
    ]);
    spawnSync("kubectl", [
      "config",
      "set-context",
      contextName,
      "--cluster",
      contextName,
      "--user",
      contextName,
      "--namespace",
      appName,
    ]);

    console.log(
      chalk`Run {green kubectl config use-context ${contextName}} to switch to the context of this app.`
    );
  });
}

export default createCommand({
  builder: yargs => {
    return yargs
      .middleware(requireClusterConfig)
      .middleware(requireUser)
      .middleware(requireApp);
  },
  command: "get-k8s-credentials",
  describe: "Write k8s credentials with kubectl",
  handler: run,
});
