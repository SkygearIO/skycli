import chalk from 'chalk';

import { controller } from '../../api';
import { Arguments, createCommand } from '../../util';
import { requireApp, requireClusterConfig, requireUser } from '../middleware';
import { validateSecretName } from './util';

function run(argv: Arguments) {
  const secretName = argv.name as string;
  const secretValue = argv.value as string;

  return controller
    .createSecret(argv.context, secretName, secretValue)
    .then((secret) => {
      console.log(chalk`{green Success!} Created secret ${secretName}`);
      return;
    })
    .catch((error) => {
      return Promise.reject('Fail to create secret. ' + error);
    });
}

export default createCommand({
  builder: (yargs) => {
    return yargs
      .middleware(requireClusterConfig)
      .middleware(requireUser)
      .middleware(requireApp)
      .demandOption(['name', 'value'])
      .check((argv) => {
        if (!validateSecretName(argv.name as string)) {
          return 'Invalid secret name, only capital letters, numbers and underscore are allowed';
        }
        return true;
      })
      .option('name', {
        desc:
          'Secret name, only capital letters, numbers and underscore are allowed',
        type: 'string'
      })
      .option('value', {
        desc: 'Secret value',
        type: 'string'
      });
  },
  command: 'create [name] [value]',
  describe: 'Create application secret',
  handler: run
});
