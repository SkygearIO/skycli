import chalk from "chalk";
import { edit } from "external-editor";
import * as yaml from "js-yaml";

import { Arguments, createCommand } from "../../util";
import { requireApp, requireClusterConfig, requireUser } from "../middleware";
import { cliContainer } from "../../container";

async function updateUserConfigByEditor(
  userConfigYAML: string
): Promise<string> {
  const updatedUserConfig = edit(userConfigYAML);
  if (updatedUserConfig === userConfigYAML) {
    throw new Error("cancelled");
  }
  return updatedUserConfig;
}

async function run(argv: Arguments) {
  try {
    const appName = argv.context.app || "";
    let updatedUserConfigYAML = "";
    if (argv.file) {
      // file mode
      updatedUserConfigYAML = argv.file as string;
    } else {
      // editor mode
      const userConfig = await cliContainer.getUserConfiguration(appName);
      const userConfigYAML = yaml.safeDump(userConfig);
      updatedUserConfigYAML = await updateUserConfigByEditor(userConfigYAML);
    }

    const updatedUserConfigJSON = yaml.safeLoad(updatedUserConfigYAML);

    await cliContainer.setUserConfiguration(appName, updatedUserConfigJSON);
    console.log(chalk`{green Success!} Updated user config.`);
  } catch (err) {
    if (err.message === "cancelled") {
      console.log("Cancelled, no changes.");
      return;
    }
    throw err;
  }
}

export default createCommand({
  builder: yargs => {
    return yargs
      .middleware(requireClusterConfig)
      .middleware(requireUser)
      .middleware(requireApp)
      .option("file", {
        alias: "f",
        type: "string",
        describe: "Current app user config file in yaml format",
      })
      .coerce("file", function(arg) {
        return require("fs").readFileSync(arg, "utf8");
      });
  },
  command: "update-user-config",
  describe: "Update current app user config",
  handler: run,
});
