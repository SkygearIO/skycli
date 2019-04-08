import chalk from 'chalk';

import { Arguments, createCommand } from '../../util';
import requireUser from '../middleware/requireUser';

function run(argv: Arguments) {
  console.log(chalk`Deploy cloud code to app: {green ${argv.context.app}}`);
  const cloudCode = argv.appConfig.cloudCode || {};
  Object.keys(cloudCode)
    .map((cloudCodeName) => {
      console.log(chalk`Deploying cloud code: {green ${cloudCodeName}}`);
    });
  return Promise.resolve();
}

export default createCommand({
  builder: (yargs) => {
    return yargs.middleware(requireUser).option('app', {
      desc: 'Application name',
      type: 'string'
    });
  },
  command: 'deploy',
  describe: 'Deploy skygear cloud code',
  handler: run
});
