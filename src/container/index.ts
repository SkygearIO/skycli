import {
  NodeContainer,
  ContainerStorage,
  encodeUser,
  encodeIdentity,
  decodeUser,
  decodeIdentity,
  User,
  Identity,
  ExtraSessionInfoOptions,
  AuthenticationSession,
} from "@skygear/node-client";

import { CLIContainer } from "./CLIContainer";
import { save, load, ConfigDomain } from "../config";
import { GlobalConfig } from "../types";
import { createGlobalConfig } from "../configUtil";

class CLIYAMLContainerStorage implements ContainerStorage {
  private loadGlobalConfig(): GlobalConfig {
    let globalConfig = load(ConfigDomain.GlobalDomain) as GlobalConfig;
    if (!Object.keys(globalConfig).length) {
      globalConfig = createGlobalConfig();
    }
    return globalConfig;
  }

  private cloneConfigForUserUpdate(
    globalConfig: GlobalConfig,
    namespace: string
  ): GlobalConfig {
    // deep clone the user config with the given namespace for editing
    return {
      ...globalConfig,
      user: {
        ...globalConfig.user,
        [namespace]: {
          ...globalConfig.user[namespace],
        },
      },
    };
  }

  async setUser(namespace: string, user: User): Promise<void> {
    const e = encodeUser(user);
    const globalConfig = this.loadGlobalConfig();
    const newConfig = this.cloneConfigForUserUpdate(globalConfig, namespace);
    newConfig.user[namespace].user = e;
    save(newConfig, ConfigDomain.GlobalDomain);
  }

  async setIdentity(namespace: string, identity: Identity): Promise<void> {
    const e = encodeIdentity(identity);
    const globalConfig = this.loadGlobalConfig();
    const newConfig = this.cloneConfigForUserUpdate(globalConfig, namespace);
    newConfig.user[namespace].identity = e;
    save(newConfig, ConfigDomain.GlobalDomain);
  }

  async setAccessToken(namespace: string, accessToken: string): Promise<void> {
    const globalConfig = this.loadGlobalConfig();
    const newConfig = this.cloneConfigForUserUpdate(globalConfig, namespace);
    newConfig.user[namespace].access_token = accessToken;
    save(newConfig, ConfigDomain.GlobalDomain);
  }

  async setRefreshToken(namespace: string, refreshToken: string) {
    const globalConfig = this.loadGlobalConfig();
    const newConfig = this.cloneConfigForUserUpdate(globalConfig, namespace);
    newConfig.user[namespace].refresh_token = refreshToken;
    save(newConfig, ConfigDomain.GlobalDomain);
  }

  async setSessionID(namespace: string, sessionID: string) {
    const globalConfig = this.loadGlobalConfig();
    const newConfig = this.cloneConfigForUserUpdate(globalConfig, namespace);
    newConfig.user[namespace].session_id = sessionID;
    save(newConfig, ConfigDomain.GlobalDomain);
  }

  async setOAuthRedirectAction(
    _namespace: string,
    _oauthRedirectAction: string
  ): Promise<void> {
    throw new Error("Method not implemented.");
  }

  async setExtraSessionInfoOptions(
    namespace: string,
    options: ExtraSessionInfoOptions
  ) {
    const globalConfig = this.loadGlobalConfig();
    const newConfig = this.cloneConfigForUserUpdate(globalConfig, namespace);
    newConfig.user[namespace].extra_session_info_options = options;
    save(newConfig, ConfigDomain.GlobalDomain);
  }

  async setAuthenticationSession(
    _namespace: string,
    _authenticationSession: AuthenticationSession
  ) {
    // Do not persist authentication session.
  }

  async setMFABearerToken(namespace: string, mfaBearerToken: string) {
    const globalConfig = this.loadGlobalConfig();
    const newConfig = this.cloneConfigForUserUpdate(globalConfig, namespace);
    newConfig.user[namespace].mfa_bearer_token = mfaBearerToken;
    save(newConfig, ConfigDomain.GlobalDomain);
  }

  async getUser(namespace: string): Promise<User | null> {
    const globalConfig = this.loadGlobalConfig();
    const d = globalConfig.user[namespace] && globalConfig.user[namespace].user;
    if (d) {
      return decodeUser(d);
    }
    return null;
  }

  async getIdentity(namespace: string): Promise<Identity | null> {
    const globalConfig = this.loadGlobalConfig();
    const d =
      globalConfig.user[namespace] && globalConfig.user[namespace].identity;
    if (d) {
      return decodeIdentity(d);
    }
    return null;
  }

  async getAccessToken(namespace: string): Promise<string | null> {
    const globalConfig = this.loadGlobalConfig();
    return (
      globalConfig.user[namespace] && globalConfig.user[namespace].access_token
    );
  }

  async getRefreshToken(namespace: string): Promise<string | null> {
    const globalConfig = this.loadGlobalConfig();
    return (
      (globalConfig.user[namespace] &&
        globalConfig.user[namespace].refresh_token) ||
      null
    );
  }

  async getSessionID(namespace: string): Promise<string | null> {
    const globalConfig = this.loadGlobalConfig();
    return (
      (globalConfig.user[namespace] &&
        globalConfig.user[namespace].session_id) ||
      null
    );
  }

  async getExtraSessionInfoOptions(
    namespace: string
  ): Promise<Partial<ExtraSessionInfoOptions> | null> {
    const globalConfig = this.loadGlobalConfig();
    return (
      (globalConfig.user[namespace] &&
        globalConfig.user[namespace].extra_session_info_options) ||
      null
    );
  }

  async getOAuthRedirectAction(_namespace: string): Promise<string | null> {
    throw new Error("Method not implemented.");
  }

  async getAuthenticationSession(
    _namespace: string
  ): Promise<AuthenticationSession | null> {
    // Authentication session is not persisted.
    return null;
  }

  async getMFABearerToken(namespace: string): Promise<string | null> {
    const globalConfig = this.loadGlobalConfig();
    return (
      (globalConfig.user[namespace] &&
        globalConfig.user[namespace].mfa_bearer_token) ||
      null
    );
  }

  async delUser(namespace: string): Promise<void> {
    const globalConfig = this.loadGlobalConfig();
    const newConfig = this.cloneConfigForUserUpdate(globalConfig, namespace);
    delete newConfig.user[namespace].user;
    save(newConfig, ConfigDomain.GlobalDomain);
  }

  async delIdentity(namespace: string): Promise<void> {
    const globalConfig = this.loadGlobalConfig();
    const newConfig = this.cloneConfigForUserUpdate(globalConfig, namespace);
    delete newConfig.user[namespace].identity;
    save(newConfig, ConfigDomain.GlobalDomain);
  }

  async delAccessToken(namespace: string): Promise<void> {
    const globalConfig = this.loadGlobalConfig();
    const newConfig = this.cloneConfigForUserUpdate(globalConfig, namespace);
    delete newConfig.user[namespace].access_token;
    save(newConfig, ConfigDomain.GlobalDomain);
  }

  async delRefreshToken(namespace: string) {
    const globalConfig = this.loadGlobalConfig();
    const newConfig = this.cloneConfigForUserUpdate(globalConfig, namespace);
    delete newConfig.user[namespace].refresh_token;
    save(newConfig, ConfigDomain.GlobalDomain);
  }

  async delSessionID(namespace: string) {
    const globalConfig = this.loadGlobalConfig();
    const newConfig = this.cloneConfigForUserUpdate(globalConfig, namespace);
    delete newConfig.user[namespace].session_id;
    save(newConfig, ConfigDomain.GlobalDomain);
  }

  async delOAuthRedirectAction(_namespace: string): Promise<void> {
    throw new Error("Method not implemented.");
  }

  async delAuthenticationSession(_namespace: string) {
    // Authentication session is not persisted.
  }

  async delMFABearerToken(namespace: string) {
    const globalConfig = this.loadGlobalConfig();
    const newConfig = this.cloneConfigForUserUpdate(globalConfig, namespace);
    delete newConfig.user[namespace].mfa_bearer_token;
    save(newConfig, ConfigDomain.GlobalDomain);
  }
}

export const cliContainer = new CLIContainer(
  new NodeContainer({
    storage: new CLIYAMLContainerStorage(),
  })
);
