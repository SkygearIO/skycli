import chalk from 'chalk';
import { Arguments } from '../../util';

export default function requireUser(argv: Arguments) {
  if (argv.context.user && argv.context.user.accessToken) {
    return;
  }

  return Promise.reject(chalk`{red ERROR:} Requires authentication, please login.
To login, please run:
    skycli auth login`);
}
