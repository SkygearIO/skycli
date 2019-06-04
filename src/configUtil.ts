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
import { CLIContext } from './types';
import { Arguments } from './util';

export function currentCLIContext(argv: Arguments): CLIContext {
  const globalConfig = argv.globalConfig;
  const currentContextKey = globalConfig.currentContext;

  const appConfig = argv.appConfig;
  // specify app in command or from config file
  const appName = (argv.app as string) || appConfig.app;

  return {
    app: appName,
    cluster: globalConfig.cluster && globalConfig.cluster[currentContextKey],
    debug: !!argv.debug,
    user: globalConfig.user && globalConfig.user[currentContextKey],
    verbose: !!argv.verbose
  };
}
