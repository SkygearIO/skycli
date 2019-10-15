import chalk from 'chalk';
import fs from 'fs-extra';
import inquirer from 'inquirer';
import path from 'path';

import { Arguments, createCommand } from '../../util';
import { requireClusterConfig, requireUser } from '../middleware';
import { cliContainer } from '../../container';
import {
  checkTemplateVersion,
  updateTemplates,
  listTemplates,
  ScaffoldingTemplate,
  instantiateTemplate
} from '../../container/scaffold';

async function selectApp(argv: Arguments): Promise<string> {
  if (argv.app && typeof argv.app === 'string') {
    return argv.app;
  }

  console.log('\nFetching list of your apps...');
  const apps = await cliContainer.getApps();
  const appsName = apps.map((a) => a.name);
  const answers = await inquirer.prompt([
    {
      choices: appsName,
      message: 'Select an app to be associated with the directory:',
      name: 'app',
      type: 'list'
    }
  ]);

  return answers.app;
}

async function selectTemplate(): Promise<ScaffoldingTemplate> {
  const { currentVersion, latestVersion } = await checkTemplateVersion();
  let localVersion = currentVersion;

  if (latestVersion && currentVersion !== latestVersion) {
    console.log('Updating templates...');
    try {
      await updateTemplates(latestVersion);
    } catch (error) {
      console.log(chalk`{yellow WARN:} Failed to update templates`);
    }
    localVersion = latestVersion;
  }

  if (!localVersion) {
    throw new Error(chalk`{red ERROR:} No local scaffolding templates found.`);
  }
  const templates = listTemplates();

  const answers = await inquirer.prompt([
    {
      choices: templates.map((t) => ({ name: t.name, value: t })),

      message: 'Select template:',
      name: 'template',
      type: 'list'
    }
  ]);
  return answers.template;
}

async function confirmProjectDirectory(projectDir: string): Promise<boolean> {
  const answers = await inquirer.prompt([
    {
      message:
        "You're about to initialze a Skygear app in this " +
        `directory: ${projectDir}\n` +
        'Confirm?',
      name: 'proceed',
      type: 'confirm'
    }
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
        name: 'proceed',
        type: 'confirm'
      }
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

  const appName = await selectApp(argv);
  const template = await selectTemplate();

  fs.emptyDirSync(projectDir);
  instantiateTemplate(template, projectDir);

  console.log(
    chalk`{green Success!} Initialized {green "${
      template.name
    }"} template for {green "${appName}"} in {green "${projectDir}"}.`
  );
}

export default createCommand({
  builder: (yargs) => {
    return yargs
      .middleware(requireClusterConfig)
      .middleware(requireUser)
      .default('dest', '.')
      .option('app', {
        desc: 'App name',
        type: 'string'
      });
  },
  command: 'scaffold [dest]',
  describe: 'Scaffold Skygear app',
  handler: run
});
