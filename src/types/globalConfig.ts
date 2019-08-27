import { ClusterConfig } from './clusterConfig';
import { JSONObject } from '@skygear/node-client';

const defaultContext = 'default';

interface ClusterUserConfig {
  identity: JSONObject;
  user: JSONObject;
  access_token: string;
}
interface ConfigContext {
  cluster: string;
  user: string;
}

function createConfigContext(): ConfigContext {
  return {
    cluster: defaultContext,
    user: defaultContext
  };
}

interface UserMap {
  [s: string]: ClusterUserConfig;
}
interface ClusterConfigMap {
  [s: string]: ClusterConfig;
}
interface ContextMap {
  [s: string]: ConfigContext;
}

export interface GlobalConfig {
  cluster: ClusterConfigMap;
  context: ContextMap;
  current_context: string;
  user: UserMap;
}

export function createGlobalConfig(): GlobalConfig {
  return {
    cluster: {},
    context: {
      [defaultContext]: createConfigContext()
    },
    current_context: defaultContext,
    user: {}
  };
}
