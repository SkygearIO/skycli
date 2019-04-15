import chalk from 'chalk';
import inquirer from 'inquirer';

import { controller } from '../../api';
import * as config from '../../config';
import { Arguments, createCommand } from '../../util';
import { updateGlobalConfigUser } from './util';

function run(argv: Arguments) {
  const user = argv.context.user;
  if (!user) {
    return Promise.reject(`Not logged in to accounts.`);
  }

  return inquirer
    .prompt([
      {
        message: `Log out as ${user.metadata.email}?`,
        name: 'confirm',
        type: 'confirm'
      }
    ])
    .then((answers) => {
      if (!answers.confirm) {
        return Promise.reject(`Cancelled logout.`);
      }

      return controller.logout(argv.context);
    })
    .then(() => {
      // remove user from global config
      const newGlobalConfig = updateGlobalConfigUser(argv.globalConfig, null);
      config.save(newGlobalConfig, config.ConfigDomain.GlobalDomain);

      console.log(chalk.green('Successfully logged out.'));
    })
    .catch((error) => {
      if (argv.debug) {
        console.error(error);
      }
      return Promise.reject(`${error}`);
    });
}

export default createCommand({
  command: 'logout',
  describe: 'Log out Skygear cluster user',
  handler: run
});
