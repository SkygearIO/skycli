import chalk from 'chalk';

import { Arguments, createCommand } from '../../util';
import { MiddlewareFunction } from 'yargs';
import { requireApp, requireClusterConfig, requireUser } from '../middleware';
import { cliContainer } from '../../container';

async function run(argv: Arguments) {
  const secretName = argv.name as string;
  const secretValue = (argv.value || argv.file) as string;
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

const requireSecretValue = (function(argv: Arguments): Promise<void> {
  let crt = 0;
  if (argv.value) {
    crt++;
  }

  if (argv.file) {
    crt++;
  }
  if (crt === 0) {
    return Promise.reject(
      chalk`{red ERROR:} Missing required arguments: value or file`
    );
  }
  if (crt > 1) {
    return Promise.reject(
      chalk`{red ERROR:} Only either value or file is allowed`
    );
  }

  return Promise.resolve();
} as any) as MiddlewareFunction;

export default createCommand({
  builder: (yargs) => {
    return yargs
      .middleware(requireClusterConfig)
      .middleware(requireUser)
      .middleware(requireApp)
      .middleware(requireSecretValue)
      .demandOption(['name'])
      .option('name', {
        desc:
          'Secret name. Only letters, numbers, underscore, hyphen and dot are allowed',
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
      })
      .option('file', {
        alias: 'f',
        desc: 'Secret value from file',
        type: 'string'
      })
      .coerce('file', function(arg) {
        return require('fs').readFileSync(arg, 'utf8');
      });
  },
  command: 'create [name] [value]',
  describe: 'Create app secret',
  handler: run
});
