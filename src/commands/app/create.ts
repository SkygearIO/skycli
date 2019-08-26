import chalk from 'chalk';
import inquirer from 'inquirer';

import { Arguments, createCommand } from '../../util';
import { requireClusterConfig, requireUser } from '../middleware';
import AppScaffoldCommand from './scaffold';
import { cliContainer } from '../../container';

const appNamePrompt: inquirer.Question = {
  message: 'What is your app name?',
  name: 'app',
  type: 'input',
  validate: (input) => {
    if (input.trim() === '') {
      return 'App name is required.';
    }
    if (!input.match(/^[A-Za-z0-9]+$/i)) {
      return 'Invalid app name, only alphabetical letters and numbers are allowed.';
    }
    return true;
  }
};

function ask() {
  return inquirer.prompt([appNamePrompt]).then((answers) => {
    return {
      ...answers
    };
  });
}

function confirmScaffoldApp() {
  return inquirer.prompt([
    {
      message:
        'Do you want to setup the project folder now? ' +
        'Or you can do it later by `skycli app scaffold` command.\n' +
        'Setup now?',
      name: 'scaffoldNow',
      type: 'confirm'
    }
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
  console.log('Creating app...');

  const payload = await cliContainer.createApp(appName);
  const userConfig = payload[1];
  const endpoint = payload[2];
  const firstClient = userConfig.clients[Object.keys(userConfig.clients)[0]];

  console.log(chalk`Your API endpoint: {green ${endpoint}}.`);
  console.log(
    chalk`Your Client API Key: {green ${
      firstClient ? firstClient.api_key : ''
    }}.`
  );
  console.log(
    chalk`Your Master API Key: {green ${userConfig.master_key || ''}}.`
  );

  console.log('Created app successfully! \n');

  const answers = await confirmScaffoldApp();
  if (!answers.scaffoldNow) {
    console.log(chalk`\nTo setup later, please run:\n    skycli app scaffold`);
    return;
  }

  return AppScaffoldCommand.execute({
    ...argv,
    app: appName,
    dest: '.'
  });
}

export default createCommand({
  builder: (yargs) => {
    return yargs
      .middleware(requireClusterConfig)
      .middleware(requireUser)
      .option('app', {
        desc: 'Application name',
        type: 'string'
      });
  },
  command: 'create',
  describe: 'Create skygear application',
  handler: run
});
