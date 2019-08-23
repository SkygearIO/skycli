import * as yaml from 'js-yaml';

import { controller } from '../../api';
import { Arguments, createCommand } from '../../util';
import { requireApp, requireClusterConfig, requireUser } from '../middleware';

async function run(argv: Arguments) {
  const userConfig = await controller.getUserConfig(argv.context);
  const userConfigYAML = yaml.safeDump(userConfig);
  console.log(userConfigYAML);
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
