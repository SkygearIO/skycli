import chalk from 'chalk';
import inquirer from 'inquirer';

import { controller } from '../../api';
import * as config from '../../config';
import { Arguments, createCommand } from '../../util';
import requireClusterConfig from '../middleware/requireClusterConfig';
import { updateGlobalConfigUser } from './util';

const emailPrompt: inquirer.Question = {
  message: 'Email:',
  name: 'email',
  type: 'input',
  validate: (input) => {
    if (input.trim() === '') {
    return 'Email is required.';
    }
    if (input.indexOf('@') === -1) {
    return 'Email is not valid (must contains @).';
    }
    return true;
  }
};

const passwordPrompt: inquirer.Question = {
  message: 'Password:',
  name: 'password',
  type: 'password',
  validate: (input) => {
    if (input === '') {
    return 'Password is required.';
    }
    return true;
  }
};

function askCredentials(argv: Arguments) {
  const prompts = [];
  const credentials = {
    email: argv.email as string,
    password: argv.password as string
  };

  if (credentials.email) {
    console.log(`Sign up as ${credentials.email}.`);
  } else {
    prompts.push(emailPrompt);
  }

  prompts.push(passwordPrompt);

  return inquirer.prompt(prompts).then((answers) => {
    return {
      ...credentials,
      ...answers
    };
  });
}

function run(argv: Arguments) {
  let email: string;

  return askCredentials(argv)
    .then((answers) => {
      email = answers.email;
      return controller.signupWithEmail(argv.context, answers.email, answers.password);
    })
    .then((payload) => {
      if (argv.debug) {
        console.log(payload);
      }
      const newGlobalConfig = updateGlobalConfigUser(argv.globalConfig, payload);
      config.save(newGlobalConfig, config.ConfigDomain.GlobalDomain);
      console.log(chalk`Sign up as {green ${email}}.`);
    }).catch ((error) => {
      if (argv.debug) {
        console.error(error);
      }
      return Promise.reject(`${error}`);
    });
}

export default createCommand({
  builder: (yargs) => {
    return yargs
      .middleware(requireClusterConfig);
  },
  command: 'signup',
  describe: 'Sign up skygear cluster user',
  handler: run
});
