import chalk from 'chalk';
import inquirer from 'inquirer';

import { Arguments, createCommand } from '../../util';
import { cliContainer } from '../../container';

async function run(argv: Arguments) {
  const userContext = argv.context.user;

  if (!userContext) {
    throw new Error(`Not logged in to accounts.`);
  }

  try {
    const email =
      ('loginID' in userContext.identity && userContext.identity.loginID) || '';
    const answers = await inquirer.prompt([
      {
        message: `Log out as ${email}?`,
        name: 'confirm',
        type: 'confirm'
      }
    ]);
    if (!answers.confirm) {
      throw new Error('cancelled');
    }
    await cliContainer.container.auth.logout();
    console.log(chalk.green('Successfully logged out.'));
  } catch (error) {
    if (error.message === 'cancelled') {
      return;
    }
    throw error;
  }
}

export default createCommand({
  command: 'logout',
  describe: 'Log out developer',
  handler: run
});
