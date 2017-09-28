/**
 * Copyright 2017 Oursky Ltd.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */
import _ from 'lodash';
import chalk from 'chalk';

export function createCommand(module) {
  return _.assign(
    {},
    module,
    {
      handler: function (argv) {
        let p = module.handler(argv);
        if (p && typeof p.catch === 'function') {
          p.catch((err) => {
            if (err) {
              if (typeof err === 'object') {
                err = JSON.stringify(err);
              }
              console.log(chalk.red(err));
            }
            process.exit(1);
          });
        }
      },
      execute: module.handler
    }
  );
}

export function executeCommand(module, argv) {
  return module.execute(argv);
}
