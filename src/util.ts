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
import {
  Arguments as YargsArguments,
  CommandModule as YargsCommandModule
} from 'yargs'

export interface Arguments extends YargsArguments {
  debug: boolean;
  verbose: boolean;
  environment: string;
}

export interface CommandModule extends YargsCommandModule {
  execute?(argv: Arguments): Promise<void>;
  handler(argv: Arguments): Promise<void>;
}

export function createCommand(module: CommandModule) {
  return _.assign(
    {},
    module,
    {
      handler: function (argv: Arguments) {
        let p = module.handler(argv);
        if (p && typeof p.catch === 'function') {
          p.catch((err: Error | string) => {
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

export function executeCommand(module: CommandModule, argv: Arguments) {
  return module.execute(argv);
}
