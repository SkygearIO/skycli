import chalk from 'chalk';

import { Arguments, createCommand } from '../../util';
import { requireApp, requireClusterConfig, requireUser } from '../middleware';
import { validateSecretName } from './util';
import { cliContainer } from '../../container';

async function run(argv: Arguments) {
  const secretName = argv.name as string;
  const secretValue = argv.value as string;
  await cliContainer.createSecret(
    argv.context.app || '',
    secretName,
    secretValue
  );
  console.log(chalk`{green Success!} Created secret ${secretName}`);
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
  describe: 'Create app secret',
  handler: run
});
