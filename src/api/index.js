import _ from 'lodash';

import * as controller from './controller';

export function setControllerEnvironment(environmentConfig) {
  _.assign(controller.config, environmentConfig);
}

export { controller };
