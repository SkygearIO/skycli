import { spawnSync } from "child_process";

import chalk from "chalk";
import { withFile } from "tmp-promise";
import { ensureFile, writeFile } from "fs-extra";

import { Arguments, createCommand } from "../../util";
import { programPath } from "../../program";
import {
  requireClusterConfig,
  requireUser,
  requireApp,
  requireProgram,
  requireKubectlVersion,
} from "../middleware";
import { cliContainer } from "../../container";

async function run(argv: Arguments) {
  await withFile(async ({ path }) => {
    const appName = argv.context.app ?? "";
    const contextName = argv.context.currentContext ?? "";
    const { cluster_name } = await cliContainer.getClusterConfig();
    const k8sContextName = `skygear-${cluster_name}-${appName}`;
    const {
      server,
      certificate_authority_data,
    } = await cliContainer.createServiceAccount(appName);

    let setClusterArgs = [
      "config",
      "set-cluster",
      k8sContextName,
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
      k8sContextName,
      "--exec-command",
      programPath(),
      "--exec-api-version=client.authentication.k8s.io/v1beta1",
      "--exec-arg=--app",
      "--exec-arg",
      appName,
      "--exec-arg=--context",
      "--exec-arg",
      contextName,
      "--exec-arg=app",
      "--exec-arg=get-k8s-token-request",
    ]);
    spawnSync("kubectl", [
      "config",
      "set-context",
      k8sContextName,
      "--cluster",
      k8sContextName,
      "--user",
      k8sContextName,
      "--namespace",
      appName,
    ]);

    console.log(
      chalk`Run {green kubectl config use-context ${k8sContextName}} to switch to the context of this app.`
    );
  });
}

export default createCommand({
  builder: yargs => {
    return (
      yargs
        .middleware(requireClusterConfig)
        .middleware(requireUser)
        .middleware(requireApp)
        .middleware(requireProgram("kubectl") as any)
        // kubectl config set-credentials --exec-* requires >= 1.15
        .middleware(requireKubectlVersion(1, 15) as any)
    );
  },
  command: "get-k8s-credentials",
  describe: "Write k8s credentials with kubectl",
  handler: run,
});
