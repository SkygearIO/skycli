import chalk from 'chalk';
import inquirer from 'inquirer';

import { controller } from '../../api';
import { Arguments, createCommand } from '../../util';
import { requireApp, requireClusterConfig, requireUser } from '../middleware';

function confirm(secretName: string) {
  return inquirer.prompt([
    {
      message: `Are you sure to delete secret ${secretName}?`,
      name: 'proceed',
      type: 'confirm'
    }
  ]);
}

function run(argv: Arguments) {
  const secretName = argv.name as string;

  return confirm(secretName)
    .then((answers) => {
      if (!answers.proceed) {
        return Promise.reject('cancelled');
      }
      return controller.deleteSecret(argv.context, secretName);
    })
    .then((_secret) => {
      console.log(chalk`{green Success!} Deleted secret ${secretName}`);
      return;
    })
    .catch((error) => {
      if (error === 'cancelled') {
        return Promise.resolve();
      }
      return Promise.reject('Fail to delete secret. ' + error);
    });
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
  describe: 'Delete application secret',
  handler: run
});
