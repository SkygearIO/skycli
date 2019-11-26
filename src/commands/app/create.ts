import chalk from "chalk";
import inquirer from "inquirer";

import { Arguments, createCommand } from "../../util";
import { requireClusterConfig, requireUser } from "../middleware";
import AppScaffoldCommand from "./scaffold";
import { cliContainer } from "../../container";

const appNamePrompt: inquirer.Question = {
  message: "What is your app name?",
  name: "app",
  type: "input",
  validate: input => {
    if (input.trim() === "") {
      return "App name is required.";
    }
    return true;
  },
};

function ask() {
  return inquirer.prompt([appNamePrompt]).then(answers => {
    return {
      ...answers,
    };
  });
}

function confirmScaffoldApp() {
  return inquirer.prompt([
    {
      message:
        "Do you want to scaffold your app now? " +
        "Or you can do it later by `skycli app scaffold` command.\n" +
        "Scaffold now?",
      name: "scaffoldNow",
      type: "confirm",
    },
  ]);
}

async function run(argv: Arguments) {
  let appName = argv.app as string;

  if (!appName) {
    const answers = await ask();
    if (!answers.app) {
      return;
    }
    appName = answers.app;
  }

  console.log(chalk`App name: {green ${appName}}.`);
  console.log("Creating app...");

  const payload = await cliContainer.createApp(appName);
  const userConfig = payload[1];
  const endpoint = payload[2];
  const firstClient = userConfig.clients[Object.keys(userConfig.clients)[0]];

  console.log(chalk`Your API endpoint: {green ${endpoint}}.`);
  console.log(
    chalk`Your API Key: {green ${firstClient ? firstClient.api_key : ""}}.`
  );
  console.log(chalk`Your Master Key: {green ${userConfig.master_key || ""}}.`);

  console.log("Created app successfully! \n");

  const answers = await confirmScaffoldApp();
  if (!answers.scaffoldNow) {
    console.log(
      chalk`\nTo scaffold later, please run:\n    skycli app scaffold`
    );
    return;
  }

  return AppScaffoldCommand.execute({
    ...argv,
    app: appName,
    dest: ".",
  });
}

export default createCommand({
  builder: yargs => {
    return yargs
      .middleware(requireClusterConfig)
      .middleware(requireUser)
      .option("app", {
        desc: "App name",
        type: "string",
      });
  },
  command: "create",
  describe: "Create Skygear app",
  handler: run,
});
