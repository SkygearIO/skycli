import * as yaml from "js-yaml";

import { Arguments, createCommand } from "../../util";
import { requireApp, requireClusterConfig, requireUser } from "../middleware";
import { cliContainer } from "../../container";

async function run(argv: Arguments) {
  const appConfig = await cliContainer.getAppConfiguration(
    argv.context.app || ""
  );
  const appConfigYAML = yaml.safeDump(appConfig);
  console.log(appConfigYAML);
}

export default createCommand({
  builder: yargs => {
    return yargs
      .middleware(requireClusterConfig)
      .middleware(requireUser)
      .middleware(requireApp);
  },
  command: "view-config",
  describe: "View current app config",
  handler: run,
});
