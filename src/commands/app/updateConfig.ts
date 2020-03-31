import chalk from "chalk";
import { edit } from "external-editor";
import * as yaml from "js-yaml";

import { Arguments, createCommand } from "../../util";
import { requireApp, requireClusterConfig, requireUser } from "../middleware";
import { cliContainer } from "../../container";

async function updateAppConfigByEditor(appConfigYAML: string): Promise<string> {
  const updatedAppConfig = edit(appConfigYAML);
  if (updatedAppConfig === appConfigYAML) {
    throw new Error("cancelled");
  }
  return updatedAppConfig;
}

async function run(argv: Arguments) {
  try {
    const appName = argv.context.app || "";
    let updatedAppConfigYAML = "";
    if (argv.file) {
      // file mode
      updatedAppConfigYAML = argv.file as string;
    } else {
      // editor mode
      const appConfig = await cliContainer.getAppConfiguration(appName);
      const appConfigYAML = yaml.safeDump(appConfig);
      updatedAppConfigYAML = await updateAppConfigByEditor(appConfigYAML);
    }

    const updatedAppConfigJSON = yaml.safeLoad(updatedAppConfigYAML);

    await cliContainer.setAppConfiguration(appName, updatedAppConfigJSON);
    console.log(chalk`{green Success!} Updated config.`);
  } catch (err) {
    if (err.message === "cancelled") {
      console.log("Cancelled, no changes.");
      return;
    }
    throw err;
  }
}

export default createCommand({
  builder: (yargs) => {
    return yargs
      .middleware(requireClusterConfig)
      .middleware(requireUser)
      .middleware(requireApp)
      .option("file", {
        alias: "f",
        type: "string",
        describe: "Current app config file in yaml format",
      })
      .coerce("file", function (arg) {
        return require("fs").readFileSync(arg, "utf8");
      });
  },
  command: "update-config",
  describe: "Update current app config",
  handler: run,
});
