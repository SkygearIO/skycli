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
import { CLIContext, UserContext, GlobalConfig } from "./types";
import { SkygearYAML } from "./container/types";
import { Arguments } from "./util";
import { decodeUser, decodeIdentity } from "@skygear/node-client";

const defaultContext = "default";

export function createGlobalConfig(): GlobalConfig {
  return {
    cluster: {},
    context: {
      [defaultContext]: {
        cluster: defaultContext,
        user: defaultContext,
      },
    },
    current_context: defaultContext,
    user: {},
  };
}

export function currentCLIContext(
  argv: Arguments,
  config: { skygearYAML: SkygearYAML; globalConfig: GlobalConfig }
): CLIContext {
  const { skygearYAML, globalConfig } = config;
  const currentContextKey = globalConfig.current_context;

  // specify app in command or from config file
  const appName = (argv.app as string) || skygearYAML.app;

  const clusterContextKey = globalConfig.context[currentContextKey].cluster;
  const userContextKey = globalConfig.context[currentContextKey].user;

  // decode user context from global yaml config
  const clusterUserConfig =
    globalConfig.user && globalConfig.user[userContextKey];
  const userContext: UserContext | null =
    (clusterUserConfig &&
      clusterUserConfig.user &&
      clusterUserConfig.identity &&
      clusterUserConfig.access_token && {
        user: decodeUser(clusterUserConfig.user),
        identity: decodeIdentity(clusterUserConfig.identity),
        access_token: clusterUserConfig.access_token,
      }) ||
    null;

  return {
    skygearYAML,
    app: appName,
    cluster: globalConfig.cluster && globalConfig.cluster[clusterContextKey],
    debug: !!argv.debug,
    user: userContext,
    verbose: !!argv.verbose,
  };
}
