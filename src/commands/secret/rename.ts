import chalk from 'chalk';

import { controller } from '../../api';
import { Arguments, createCommand } from '../../util';
import { requireApp, requireClusterConfig, requireUser } from '../middleware';
import { validateSecretName } from './util';

function run(argv: Arguments) {
  const oldSecretName = argv['old-name'] as string;
  const newSecretName = argv['new-name'] as string;

  return controller
    .renameSecret(argv.context, oldSecretName, newSecretName)
    .then((_secret) => {
      console.log(
        chalk`{green Success!} Renamed secret from ${oldSecretName} to ${newSecretName}`
      );
    })
    .catch((error) => {
      return Promise.reject('Fail to rename secret. ' + error);
    });
}

export default createCommand({
  builder: (yargs) => {
    return yargs
      .middleware(requireClusterConfig)
      .middleware(requireUser)
      .middleware(requireApp)
      .demandOption(['old-name', 'new-name'])
      .check((argv) => {
        if (!validateSecretName(argv['new-name'] as string)) {
          return 'Invalid secret name, only capital letters, numbers and underscore are allowed';
        }
        return true;
      })
      .option('old-name', {
        desc: 'Original Secret name',
        type: 'string'
      })
      .option('new-name', {
        desc:
          'New secret name, only capital letters, numbers and underscore are allowed',
        type: 'string'
      });
  },
  command: 'rename [old-name] [new-name]',
  describe: 'Rename application secret',
  handler: run
});
