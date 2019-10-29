import chalk from 'chalk';

import { Arguments, createCommand } from '../../util';
import { requireApp, requireClusterConfig, requireUser } from '../middleware';
import { cliContainer } from '../../container';

async function run(argv: Arguments) {
  const secretName = argv.name as string;
  const secretValue = argv.value as string;
  const secretType = argv.type as string;
  const encodedValue = Buffer.from(secretValue).toString('base64');
  await cliContainer.createSecret(
    argv.context.app || '',
    secretName,
    encodedValue,
    secretType
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
      .option('name', {
        desc:
          'Secret name, only letters, numbers, underscore, hyphen and dot are allowed',
        type: 'string'
      })
      .option('value', {
        desc: 'Secret value',
        type: 'string'
      })
      .option('type', {
        desc: 'Secret type',
        type: 'string',
        default: 'opaque'
      });
  },
  command: 'create [name] [value]',
  describe: 'Create app secret',
  handler: run
});
