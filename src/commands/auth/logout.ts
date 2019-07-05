import chalk from 'chalk';
import inquirer from 'inquirer';

import { controller } from '../../api';
import * as config from '../../config';
import { Arguments, createCommand } from '../../util';
import { updateGlobalConfigUser } from './util';

async function run(argv: Arguments) {
  const user = argv.context.user;
  if (!user) {
    throw new Error(`Not logged in to accounts.`);
  }

  try {
    const answers = await inquirer.prompt([
      {
        // TODO(identity): Get email from current identity
        message: `Log out as ${user.userID}?`,
        name: 'confirm',
        type: 'confirm'
      }
    ]);
    if (!answers.confirm) {
      throw new Error('cancelled');
    }

    await controller.logout(argv.context);
  } catch (error) {
    if (error.message === 'cancelled') {
      return;
    }
    if (argv.debug) {
      console.error(error);
    }
  }

  // remove user from global config
  const newGlobalConfig = updateGlobalConfigUser(argv.globalConfig, null);
  config.save(newGlobalConfig, config.ConfigDomain.GlobalDomain);
  console.log(chalk.green('Successfully logged out.'));
}

export default createCommand({
  command: 'logout',
  describe: 'Log out Skygear cluster user',
  handler: run
});
