import chalk from "chalk";
import fs from "fs-extra";
import inquirer from "inquirer";
import path from "path";

import { Arguments, createCommand } from "../../util";
import { requireClusterConfig, requireUser } from "../middleware";
import { cliContainer } from "../../container";
import {
  checkTemplateVersion,
  updateTemplates,
  listTemplates,
  ScaffoldingTemplate,
  instantiateTemplate,
} from "../../container/scaffold";
import { App } from "../../container/types";

async function selectApp(argv: Arguments): Promise<App> {
  const apps = await cliContainer.getApps();

  if (argv.app && typeof argv.app === "string") {
    const app = apps.find(app => app.name === argv.app);
    if (!app) {
      throw new Error("App not found.");
    }
  }

  const answers = await inquirer.prompt([
    {
      choices: apps.map(app => ({ name: app.name, value: app })),
      message: "Select an app to be associated with the directory:",
      name: "app",
      type: "list",
    },
  ]);

  return answers.app;
}

async function selectTemplate(): Promise<ScaffoldingTemplate> {
  const { currentVersion, latestVersion } = await checkTemplateVersion();
  let localVersion = currentVersion;

  if (latestVersion && currentVersion !== latestVersion) {
    console.log("Updating templates...");
    try {
      await updateTemplates(latestVersion);
      localVersion = latestVersion;
    } catch (error) {
      console.log(chalk`{yellow WARN:} Failed to update templates`);
    }
  }

  if (!localVersion) {
    throw new Error(chalk`{red ERROR:} No local scaffolding templates found.`);
  }
  const templates = listTemplates();

  const answers = await inquirer.prompt([
    {
      choices: templates.map(t => ({ name: t.name, value: t })),

      message: "Select template:",
      name: "template",
      type: "list",
    },
  ]);
  return answers.template;
}

async function confirmProjectDirectory(projectDir: string): Promise<boolean> {
  const answers = await inquirer.prompt([
    {
      message:
        "You're about to initialze a Skygear app in this " +
        `directory: ${projectDir}\n` +
        "Confirm?",
      name: "proceed",
      type: "confirm",
    },
  ]);

  let proceed = Boolean(answers.proceed);
  if (
    proceed &&
    fs.existsSync(projectDir) &&
    fs.lstatSync(projectDir).isDirectory() &&
    fs.readdirSync(projectDir).length > 0
  ) {
    const answers = await inquirer.prompt([
      {
        message: `All files in ${projectDir} would be DELETED. Confirm?`,
        name: "proceed",
        type: "confirm",
      },
    ]);
    proceed = Boolean(answers.proceed);
  }

  return proceed;
}

async function run(argv: Arguments) {
  const projectDir = path.resolve(argv.dest as string);

  const proceed = await confirmProjectDirectory(projectDir);
  if (!proceed) {
    return;
  }

  const app = await selectApp(argv);
  const config = await cliContainer.getUserConfiguration(app.name);
  const template = await selectTemplate();

  fs.emptyDirSync(projectDir);
  const firstClient = config.clients[Object.keys(config.clients)[0]];
  instantiateTemplate(template, projectDir, {
    appName: app.name,
    apiEndpoint: app.endpoints[0],
    apiKey: firstClient.api_key,
  });

  console.log(
    chalk`{green Success!} Initialized {green "${template.name}"} template for {green "${app.name}"} in {green "${projectDir}"}.`
  );
}

export default createCommand({
  builder: yargs => {
    return yargs
      .middleware(requireClusterConfig)
      .middleware(requireUser)
      .default("dest", ".")
      .option("app", {
        desc: "App name",
        type: "string",
      });
  },
  command: "scaffold [dest]",
  describe: "Scaffold Skygear app",
  handler: run,
});
