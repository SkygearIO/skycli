import chalk from 'chalk';

import { controller } from '../../api';
import * as config from '../../config';
import { Arguments, createCommand } from '../../util';
import requireClusterConfig from '../middleware/requireClusterConfig';
import { askCredentials, updateGlobalConfigUser } from './util';

function run(argv: Arguments) {
  let email: string;

  return askCredentials(argv)
    .then((answers) => {
      email = answers.email;
      return controller.loginWithEmail(argv.context, answers.email, answers.password);
    })
    .then((payload) => {
      if (argv.debug) {
        console.log(payload);
      }
      const newGlobalConfig = updateGlobalConfigUser(argv.globalConfig, payload);
      config.save(newGlobalConfig, config.ConfigDomain.GlobalDomain);
      console.log(chalk`Login as {green ${email}}.`);
    }).catch ((error) => {
      if (argv.debug) {
        console.error(error);
      }
      return Promise.reject(`${error}`);
    });
}

export default createCommand({
  builder: (yargs) => {
    return yargs
      .middleware(requireClusterConfig)
      .option('email', {
        desc: 'Login as email',
        type: 'string'
      });
  },
  command: 'login',
  describe: 'Login Skygear cluster user',
  handler: run
});
