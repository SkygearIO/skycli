import chalk from 'chalk';

import { controller } from '../../api';
import * as config from '../../config';
import { Arguments, createCommand } from '../../util';
import { requireClusterConfig } from '../middleware';
import { askCredentials, updateGlobalConfigUser } from './util';

function run(argv: Arguments) {
  let email: string;

  return askCredentials(argv)
    .then((answers) => {
      email = answers.email;
      return controller.signupWithEmail(
        argv.context,
        answers.email,
        answers.password
      );
    })
    .then((payload) => {
      if (argv.debug) {
        console.log(payload);
      }
      const newGlobalConfig = updateGlobalConfigUser(
        argv.globalConfig,
        payload
      );
      config.save(newGlobalConfig, config.ConfigDomain.GlobalDomain);
      console.log(chalk`Sign up as {green ${email}}.`);
    })
    .catch((error) => {
      if (argv.debug) {
        console.error(error);
      }
      return Promise.reject(`${error}`);
    });
}

export default createCommand({
  builder: (yargs) => {
    return yargs.middleware(requireClusterConfig).option('email', {
      desc: 'Sign up as email',
      type: 'string'
    });
  },
  command: 'signup',
  describe: 'Sign up Skygear cluster user',
  handler: run
});
