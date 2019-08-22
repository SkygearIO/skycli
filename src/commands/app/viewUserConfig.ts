import * as yaml from 'js-yaml';

import { controller } from '../../api';
import { Arguments, createCommand } from '../../util';
import { requireApp, requireClusterConfig, requireUser } from '../middleware';

function run(argv: Arguments) {
  return controller
    .getUserConfig(argv.context)
    .then((userConfig: any) => {
      const userConfigYAML = yaml.safeDump(userConfig);
      console.log(userConfigYAML);
      return Promise.resolve();
    })
    .catch((error) => {
      return Promise.reject('Fail to fetch secrets. ' + error);
    });
}

export default createCommand({
  builder: (yargs) => {
    return yargs
      .middleware(requireClusterConfig)
      .middleware(requireUser)
      .middleware(requireApp);
  },
  command: 'view-user-config',
  describe: 'View current app user config',
  handler: run
});
