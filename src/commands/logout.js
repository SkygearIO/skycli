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
import inquirer from 'inquirer';
import chalk from 'chalk';

import * as config from '../config';
import { createCommand } from '../util';

function removeAccount(accountKey) {
  config.unset(['accounts', accountKey]);
  config.unsetLocal(['accounts', accountKey]);
}

function run(argv) {
  const account = argv.currentAccount;
  if (!account) {
    console.log(chalk.red('Not logged in to accounts.'));
    return;
  }

  return inquirer.prompt([{
    type: 'confirm',
    name: 'confirm',
    message: `Log out as ${account.email}?`
  }]).then((answers) => {
    if (!answers.confirm) {
      return;
    }

    removeAccount(argv.account);
    console.log(chalk.green('Successfully logged out.'));
  });
}

export default createCommand({
  command: 'logout',
  desc: 'Log out from Skygear Portal',
  handler: run
});
