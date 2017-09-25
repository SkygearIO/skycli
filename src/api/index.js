import _ from 'lodash';

import * as controller from './controller';
import * as asset from './asset';

export function setControllerEnvironment(environmentConfig) {
  _.assign(controller.config, environmentConfig);
}

export { controller, asset };
