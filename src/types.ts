import {
  Identity,
  User,
  JSONObject,
  ExtraSessionInfoOptions,
} from "@skygear/node-client";

import { SkygearYAML } from "./container/types";

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
  user?: string;
}

type Named<Key extends string, T> = { name: string } & Record<Key, T>;

export interface SkycliConfig {
  api_version: string;
  clusters?: Named<"cluster", ClusterConfig>[];
  users?: Named<"user", ClusterUserConfig>[];
  contexts?: Named<"context", ConfigContext>[];
  current_context?: string;
}

export interface UserContext {
  user: User;
  identity: Identity;
  access_token: string;
}

export interface CLIContext {
  cluster?: ClusterConfig | null;
  user?: UserContext | null;
  app?: string | null;
  debug: boolean;
  verbose: boolean;
  skygearYAML?: SkygearYAML | null;
}
