import _ from 'lodash';

import * as controller from './controller';

export function setControllerEnvironment(argv) {
  const env = (argv.auth || {}).env || argv.env;
  _.assign(controller.config, argv.controller.env[env]);
}

export { controller };
