import chalk from 'chalk';

import { Arguments, createCommand } from '../../util';
import { requireApp, requireClusterConfig, requireUser } from '../middleware';
import { validateSecretName } from './util';
import { cliContainer } from '../../container';

async function run(argv: Arguments) {
  const oldSecretName = argv['old-name'] as string;
  const newSecretName = argv['new-name'] as string;

  await cliContainer.renameSecret(
    argv.context.app || '',
    oldSecretName,
    newSecretName
  );
  console.log(
    chalk`{green Success!} Renamed secret from ${oldSecretName} to ${newSecretName}`
  );
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
  describe: 'Rename app secret',
  handler: run
});
