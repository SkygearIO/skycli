import * as yaml from "js-yaml";

import { Arguments, createCommand } from "../../util";
import { requireApp, requireClusterConfig, requireUser } from "../middleware";
import { cliContainer } from "../../container";

async function run(argv: Arguments) {
  const userConfig = await cliContainer.getUserConfiguration(
    argv.context.app || ""
  );
  const userConfigYAML = yaml.safeDump(userConfig);
  console.log(userConfigYAML);
}

export default createCommand({
  builder: yargs => {
    return yargs
      .middleware(requireClusterConfig)
      .middleware(requireUser)
      .middleware(requireApp);
  },
  command: "view-user-config",
  describe: "View current app user config",
  handler: run,
});
