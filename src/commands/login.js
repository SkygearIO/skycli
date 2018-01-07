/**
 * Copyright 2017 Oursky Ltd.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */
import _ from 'lodash';
import inquirer from 'inquirer';
import chalk from 'chalk';

import { controller } from '../api';
import * as config from '../config';
import { createCommand } from '../util';

const emailPrompt = {
  type: 'input',
  name: 'email',
  message: 'Email:',
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

const passwordPrompt = {
  type: 'password',
  name: 'password',
  message: 'Password:',
  validate: (input) => {
    if (input === '') {
      return 'Password is required.';
    }
    return true;
  }
};

function saveAccount(email, token, environment, local = false) {
  const accountKey = _.replace(`${environment}:${email}`, /\./g, '~');

  const setFn = local ? config.setLocal : config.set;
  setFn(
    ['accounts', accountKey],
    {
      token,
      environment,
      email
    }
  );
  setFn(
    'account',
    accountKey
  );
}

function run(argv) {
  let email;

  return inquirer.prompt([emailPrompt, passwordPrompt]).then((answers) => {
    email = answers.email;
    return controller.login(answers.email, answers.password);
  }).then((payload) => {
    if (argv.debug) {
      console.log(payload);
    }
    if (payload.non_field_errors) {
      return Promise.reject(payload.non_field_errors);
    }

    saveAccount(email, payload.token, argv.environment, argv.local);
    console.log(chalk.green(`Logged in as ${email}.`));
  }, (error) => {
    if (argv.debug) {
      console.error(error);
    }
    return Promise.reject('Unable to complete the request.');
  });
}

export default createCommand({
  command: 'login',
  desc: 'Log in to Skygear Portal',
  builder: (yargs) => {
    return yargs
      .option('local', {
        type: 'boolean',
        desc: config.developerMode && 'Configure account for local directory.'
      });
  },
  handler: run
});
