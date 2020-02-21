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
import { CLIContext, SkycliConfig } from "./types";
import { SkygearYAML } from "./container/types";
import { decodeUser, decodeIdentity } from "@skygear/node-client";

export function currentCLIContext(
  argv: Record<string, unknown>,
  config: { skygearYAML?: SkygearYAML; skycliConfig: SkycliConfig }
): CLIContext {
  const { skygearYAML, skycliConfig } = config;
  const currentContext =
    (argv.context as string | undefined) ?? skycliConfig.current_context;

  // specify app in command or from config file
  const app = (argv.app as string | undefined) ?? skygearYAML?.app;

  const context = skycliConfig.contexts?.find(c => c.name === currentContext)
    ?.context;
  const clusterName = context?.cluster;
  const userName = context?.user;

  const userConfig = skycliConfig.users?.find(u => u.name === userName)?.user;
  const user =
    userConfig == null
      ? undefined
      : {
          user: decodeUser(userConfig.user),
          identity: decodeIdentity(userConfig.identity),
          access_token: userConfig.access_token,
        };

  const cluster = skycliConfig.clusters?.find(c => c.name === clusterName)
    ?.cluster;

  return {
    skygearYAML,
    skycliConfig,
    currentContext,
    app,
    context,
    cluster,
    user,
    debug: !!argv.debug,
    verbose: !!argv.verbose,
  };
}
