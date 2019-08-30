import {
  NodeContainer,
  ContainerStorage,
  encodeUser,
  encodeIdentity,
  decodeUser,
  decodeIdentity,
  User,
  Identity
} from '@skygear/node-client';

import { CLIContainer } from './CLIContainer';
import { save, load, ConfigDomain } from '../config';
import { GlobalConfig } from '../types';
import { createGlobalConfig } from '../configUtil';

class CLIYAMLContainerStorage implements ContainerStorage {
  private loadGlobalConfig(): GlobalConfig {
    let globalConfig = load(ConfigDomain.GlobalDomain) as GlobalConfig;
    if (!Object.keys(globalConfig).length) {
      globalConfig = createGlobalConfig();
    }
    return globalConfig;
  }

  async setUser(namespace: string, user: User): Promise<void> {
    const e = encodeUser(user);
    const globalConfig = this.loadGlobalConfig();
    const newConfig = {
      ...globalConfig,
      user: {
        ...globalConfig.user,
        [namespace]: {
          ...globalConfig.user[namespace],
          user: e
        }
      }
    };
    save(newConfig, ConfigDomain.GlobalDomain);
  }

  async setIdentity(namespace: string, identity: Identity): Promise<void> {
    const e = encodeIdentity(identity);
    const globalConfig = this.loadGlobalConfig();
    const newConfig = {
      ...globalConfig,
      user: {
        ...globalConfig.user,
        [namespace]: {
          ...globalConfig.user[namespace],
          identity: e
        }
      }
    };
    save(newConfig, ConfigDomain.GlobalDomain);
  }

  async setAccessToken(namespace: string, accessToken: string): Promise<void> {
    const globalConfig = this.loadGlobalConfig();
    const newConfig = {
      ...globalConfig,
      user: {
        ...globalConfig.user,
        [namespace]: {
          ...globalConfig.user[namespace],
          access_token: accessToken
        }
      }
    };
    save(newConfig, ConfigDomain.GlobalDomain);
  }

  async setOAuthRedirectAction(
    _namespace: string,
    _oauthRedirectAction: string
  ): Promise<void> {
    throw new Error('Method not implemented.');
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

  async getOAuthRedirectAction(_namespace: string): Promise<string | null> {
    throw new Error('Method not implemented.');
  }

  async delUser(namespace: string): Promise<void> {
    const globalConfig = this.loadGlobalConfig();
    const newConfig = { ...globalConfig };
    delete newConfig.user[namespace].user;
    save(newConfig, ConfigDomain.GlobalDomain);
  }

  async delIdentity(namespace: string): Promise<void> {
    const globalConfig = this.loadGlobalConfig();
    const newConfig = { ...globalConfig };
    delete newConfig.user[namespace].identity;
    save(newConfig, ConfigDomain.GlobalDomain);
  }

  async delAccessToken(namespace: string): Promise<void> {
    const globalConfig = this.loadGlobalConfig();
    const newConfig = { ...globalConfig };
    delete newConfig.user[namespace].access_token;
    save(newConfig, ConfigDomain.GlobalDomain);
  }

  async delOAuthRedirectAction(_namespace: string): Promise<void> {
    throw new Error('Method not implemented.');
  }
}

export const cliContainer = new CLIContainer(
  new NodeContainer({
    storage: new CLIYAMLContainerStorage()
  })
);
