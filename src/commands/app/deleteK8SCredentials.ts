import { spawnSync } from "child_process";

import chalk from "chalk";

import { Arguments, createCommand } from "../../util";
import {
  requireClusterConfig,
  requireUser,
  requireApp,
  requireProgram,
} from "../middleware";
import { cliContainer } from "../../container";

async function run(argv: Arguments) {
  const appName = argv.context.app ?? "";
  const { cluster_name } = await cliContainer.getClusterConfig();
  const contextName = `skygear-${cluster_name}-${appName}`;
  spawnSync("kubectl", ["config", "delete-context", contextName]);
  spawnSync("kubectl", ["config", "delete-cluster", contextName]);
  spawnSync("kubectl", ["config", "unset", `users.${contextName}`]);

  let wasCurrentContextUnset = false;
  const { stdout } = spawnSync("kubectl", ["config", "current-context"], {
    encoding: "utf8",
  });
  // We are removing the current-context.
  // Unset current-context and warn the user.
  if (stdout.trim() === contextName) {
    spawnSync("kubectl", ["config", "unset", "current-context"]);
    wasCurrentContextUnset = true;
  }

  console.log("Deleted the credentials of this app from kubeconfig.");
  if (wasCurrentContextUnset) {
    console.log(
      chalk`{yellow current-context was unset.} You may want to set it with {green kubectl config use-context}.`
    );
  }
}

export default createCommand({
  builder: (yargs) => {
    return yargs
      .middleware(requireClusterConfig)
      .middleware(requireUser)
      .middleware(requireApp)
      .middleware(requireProgram("kubectl") as any);
  },
  command: "delete-k8s-credentials",
  describe: "Delete k8s credentials with kubectl",
  handler: run,
});
