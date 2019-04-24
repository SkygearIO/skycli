import chalk from 'chalk';
import { Arguments } from '../../util';

export default function requireApp(argv: Arguments) {
  if (argv.context.app) {
    return;
  }

  return Promise.reject(chalk`{red ERROR:} Requires skygear.yaml, please setup app directory.
To setup, please run:
    skycli app scaffold`);
}
