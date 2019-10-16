import chalk from 'chalk';
import inquirer from 'inquirer';

import { Arguments, createCommand } from '../../util';
import { requireApp, requireClusterConfig, requireUser } from '../middleware';
import { cliContainer } from '../../container';

function confirm(secretName: string) {
  return inquirer.prompt([
    {
      message: `Are you sure to delete secret ${secretName}?`,
      name: 'proceed',
      type: 'confirm'
    }
  ]);
}

async function run(argv: Arguments) {
  const secretName = argv.name as string;
  const answers = await confirm(secretName);
  if (!answers.proceed) {
    return;
  }
  await cliContainer.deleteSecret(argv.context.app || '', secretName);
  console.log(chalk`{green Success!} Deleted secret ${secretName}`);
}

export default createCommand({
  builder: (yargs) => {
    return yargs
      .middleware(requireClusterConfig)
      .middleware(requireUser)
      .middleware(requireApp)
      .demandOption('name')
      .option('name', {
        desc: 'Secret name',
        type: 'string'
      });
  },
  command: 'delete [name]',
  describe: 'Delete app secret',
  handler: run
});
