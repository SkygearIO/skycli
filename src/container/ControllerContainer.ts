import {
  Container,
  BaseAPIClient,
  JSONObject,
  encodeQuery,
  decodeError
} from '@skygear/node-client';

import { Secret, App, UserConfiguration } from "./types";

function decodeApp(app: any): App {
  return {
    id: app.id,
    name: app.name,
    created_at: new Date(app.created_at),
    updated_at: new Date(app.updated_at),
  };
}

export class ControllerContainer<T extends BaseAPIClient> {
  private CONTROLLER_URL = "/_controller";
  container: Container<T>;

  constructor(container: Container<T>) {
    this.container = container;
  }

  protected async fetchAPI(
    method: "GET" | "POST" | "DELETE",
    path: string,
    options: { json?: JSONObject; query?: [string, string][] } = {}
  ) {
    const { json, query } = options;
    let p = path;
    if (query != null) {
      p += encodeQuery(query);
    }

    const headers: { [name: string]: string } = {};
    if (json != null) {
      headers["content-type"] = "application/json";
    }

    const response = await this.container.fetch(p, {
      method,
      headers,
      mode: "cors",
      credentials: "include",
      body: json && JSON.stringify(json),
    });
    const jsonBody = await response.json();

    if (jsonBody["result"]) {
      return jsonBody["result"];
    } else if (jsonBody["error"]) {
      throw decodeError(jsonBody["error"]);
    }

    throw decodeError();
  }

  async getSecrets(appName: string): Promise<Secret[]> {
    return this.fetchAPI("GET", `${this.CONTROLLER_URL}/secrets`, {
      query: [["app_name", appName]],
    }).then(({ secrets }) => {
      return secrets.map((s: any) => {
        return {
          name: s.name,
          created_at: new Date(s.created_at),
          updated_at: new Date(s.updated_at),
        };
      });
    });
  }

  async createSecret(
    appName: string,
    secretName: string,
    secretValue: string
  ): Promise<void> {
    return this.fetchAPI("POST", `${this.CONTROLLER_URL}/secret`, {
      json: {
        app_name: appName,
        secret_name: secretName,
        secret_value: secretValue,
      },
    });
  }

  async renameSecret(
    appName: string,
    oldSecretName: string,
    newSecretName: string
  ): Promise<void> {
    return this.fetchAPI("POST", `${this.CONTROLLER_URL}/secret/rename`, {
      json: {
        app_name: appName,
        new_secret_name: newSecretName,
        old_secret_name: oldSecretName
      },
    });
  }

  async deleteSecret(appName: string, secretName: string): Promise<void> {
    return this.fetchAPI("DELETE", `${this.CONTROLLER_URL}/secret`, {
      query: [["app_name", appName], ["secret_name", secretName]],
    });
  }

  async createApp(name: string): Promise<App> {
    return this.fetchAPI("POST", `${this.CONTROLLER_URL}/app`, {
      json: { name },
    }).then(({ app }) => {
      return decodeApp(app);
    });
  }

  async getApps(): Promise<App[]> {
    return this.fetchAPI("GET", `${this.CONTROLLER_URL}/apps`).then(
      ({ apps }) => {
        return apps.map(decodeApp);
      }
    );
  }

  async getUserConfiguration(appName: string): Promise<UserConfiguration> {
    return this.fetchAPI("GET", `${this.CONTROLLER_URL}/userconfig`, {
      query: [["app_name", appName]],
    }).then(({ user_config }) => {
      return user_config;
    });
  }

  async setUserConfiguration(
    appName: string,
    userConfig: UserConfiguration
  ): Promise<void> {
    const payload = {
      app_name: appName,
      user_config: userConfig,
    };
    return this.fetchAPI("POST", `${this.CONTROLLER_URL}/userconfig/set`, {
      // FIXME: JSONObject has problem with ?
      json: payload as any,
    });
  }
}
