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
import {
  save,
  load,
  createSkycliConfig,
  updateUser,
  getUser,
  deleteUser,
  migrateSkycliConfig,
} from "../config";
import { SkycliConfig } from "../types";

class CLIYAMLContainerStorage implements ContainerStorage {
  private loadSkycliConfig(): SkycliConfig {
    let globalConfig = migrateSkycliConfig(load("global"));
    if (!Object.keys(globalConfig).length) {
      globalConfig = createSkycliConfig();
    }
    return globalConfig;
  }

  async setUser(namespace: string, user: User): Promise<void> {
    const e = encodeUser(user);
    save(
      updateUser(this.loadSkycliConfig(), namespace, u => {
        return {
          ...u,
          user: e,
        };
      }),
      "global"
    );
  }

  async setIdentity(namespace: string, identity: Identity): Promise<void> {
    const e = encodeIdentity(identity);
    save(
      updateUser(this.loadSkycliConfig(), namespace, u => {
        return {
          ...u,
          identity: e,
        };
      }),
      "global"
    );
  }

  async setAccessToken(namespace: string, accessToken: string): Promise<void> {
    save(
      updateUser(this.loadSkycliConfig(), namespace, u => {
        return {
          ...u,
          access_token: accessToken,
        };
      }),
      "global"
    );
  }

  async setRefreshToken(namespace: string, refreshToken: string) {
    save(
      updateUser(this.loadSkycliConfig(), namespace, u => {
        return {
          ...u,
          refresh_token: refreshToken,
        };
      }),
      "global"
    );
  }

  async setSessionID(namespace: string, sessionID: string) {
    save(
      updateUser(this.loadSkycliConfig(), namespace, u => {
        return {
          ...u,
          session_id: sessionID,
        };
      }),
      "global"
    );
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
    save(
      updateUser(this.loadSkycliConfig(), namespace, u => {
        return {
          ...u,
          extra_session_info_options: options,
        };
      }),
      "global"
    );
  }

  async setAuthenticationSession(
    _namespace: string,
    _authenticationSession: AuthenticationSession
  ) {
    // Do not persist authentication session.
  }

  async setMFABearerToken(namespace: string, mfaBearerToken: string) {
    save(
      updateUser(this.loadSkycliConfig(), namespace, u => {
        return {
          ...u,
          mfa_bearer_token: mfaBearerToken,
        };
      }),
      "global"
    );
  }

  async getUser(namespace: string): Promise<User | null> {
    const skycliConfig = this.loadSkycliConfig();
    const d = getUser(skycliConfig, namespace)?.user;
    return d != null ? decodeUser(d) : null;
  }

  async getIdentity(namespace: string): Promise<Identity | null> {
    const skycliConfig = this.loadSkycliConfig();
    const d = getUser(skycliConfig, namespace)?.identity;
    return d != null ? decodeIdentity(d) : null;
  }

  async getAccessToken(namespace: string): Promise<string | null> {
    const skycliConfig = this.loadSkycliConfig();
    return getUser(skycliConfig, namespace)?.access_token ?? null;
  }

  async getRefreshToken(namespace: string): Promise<string | null> {
    const skycliConfig = this.loadSkycliConfig();
    return getUser(skycliConfig, namespace)?.refresh_token ?? null;
  }

  async getSessionID(namespace: string): Promise<string | null> {
    const skycliConfig = this.loadSkycliConfig();
    return getUser(skycliConfig, namespace)?.session_id ?? null;
  }

  async getExtraSessionInfoOptions(
    namespace: string
  ): Promise<Partial<ExtraSessionInfoOptions> | null> {
    const skycliConfig = this.loadSkycliConfig();
    return getUser(skycliConfig, namespace)?.extra_session_info_options ?? null;
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
    const skycliConfig = this.loadSkycliConfig();
    return getUser(skycliConfig, namespace)?.mfa_bearer_token ?? null;
  }

  async delUser(namespace: string): Promise<void> {
    save(deleteUser(this.loadSkycliConfig(), namespace), "global");
  }

  async delIdentity(namespace: string): Promise<void> {
    save(deleteUser(this.loadSkycliConfig(), namespace), "global");
  }

  async delAccessToken(namespace: string): Promise<void> {
    save(deleteUser(this.loadSkycliConfig(), namespace), "global");
  }

  async delRefreshToken(namespace: string) {
    save(deleteUser(this.loadSkycliConfig(), namespace), "global");
  }

  async delSessionID(namespace: string) {
    save(deleteUser(this.loadSkycliConfig(), namespace), "global");
  }

  async delOAuthRedirectAction(_namespace: string): Promise<void> {
    throw new Error("Method not implemented.");
  }

  async delAuthenticationSession(_namespace: string) {
    // Authentication session is not persisted.
  }

  async delMFABearerToken(namespace: string) {
    save(
      updateUser(this.loadSkycliConfig(), namespace, u => {
        return {
          ...u,
          mfa_bearer_token: undefined,
        };
      }),
      "global"
    );
  }
}

export const cliContainer = new CLIContainer(
  new NodeContainer({
    storage: new CLIYAMLContainerStorage(),
  })
);
