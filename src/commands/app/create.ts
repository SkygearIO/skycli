import chalk from 'chalk';
import inquirer from 'inquirer';

import { controller } from '../../api';
import { Arguments, createCommand } from '../../util';
import { requireClusterConfig, requireUser } from '../middleware';
import AppScaffoldCommand from './scaffold';

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

function ask(argv: Arguments) {
  const prompts = [];
  const appName = argv.app as string;

  if (appName) {
    console.log(chalk`App name: {green ${appName}}.`);
  } else {
    prompts.push(appNamePrompt);
  }

  if (prompts.length === 0) {
    return Promise.resolve({ appName });
  }

  return inquirer.prompt(prompts).then((answers) => {
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

function run(argv: Arguments) {
  let appName: string;

  return ask(argv)
    .then((answers) => {
      appName = answers.app;
      console.log('Creating app...');
      return controller.createApp(argv.context, appName);
    })
    .then((payload) => {
      console.log(chalk`Your API endpoint: {green ${payload.endpoint}}.`);
      console.log(
        chalk`Your Client API Key: {green ${payload.config.apiKey}}.`
      );
      console.log(
        chalk`Your Master API Key: {green ${payload.config.masterKey}}.`
      );
      console.log('Created app successfully! \n');

      return confirmScaffoldApp();
    })
    .then((answers) => {
      if (!answers.scaffoldNow) {
        console.log(
          chalk`\nTo setup later, please run:\n    skycli app scaffold`
        );
        return;
      }

      return AppScaffoldCommand.execute({
        ...argv,
        app: appName,
        dest: '.'
      });
    })
    .catch((error) => {
      return Promise.reject('Fail to create application. ' + error);
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
