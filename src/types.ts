import { DeploymentItemConfig, HookConfig } from "./container/types";
import {
  Identity,
  User,
  JSONObject,
  ExtraSessionInfoOptions,
} from "@skygear/node-client";

export interface ClusterConfig {
  env: string | null;
  endpoint: string;
  api_key: string;
}

export interface ClusterUserConfig {
  identity: JSONObject;
  user: JSONObject;
  access_token: string;
  refresh_token?: string;
  session_id?: string;
  extra_session_info_options?: ExtraSessionInfoOptions;
  mfa_bearer_token?: string;
}
export interface ConfigContext {
  cluster: string;
  user: string;
}
export interface GlobalConfig {
  cluster: { [s: string]: ClusterConfig };
  context: { [s: string]: ConfigContext };
  current_context: string;
  user: { [s: string]: ClusterUserConfig };
}

export interface UserContext {
  user: User;
  identity: Identity;
  access_token: string;
}
export interface CLIContext {
  cluster: ClusterConfig | null;
  user: UserContext | null;
  app: string | null;
  debug: boolean;
  verbose: boolean;
}

export interface AppConfig {
  app: string;
  deployments: { [name: string]: DeploymentItemConfig };
  hooks: HookConfig[];
}
