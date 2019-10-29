import {
  Container,
  BaseAPIClient,
  JSONObject,
  encodeQuery,
  decodeError
} from '@skygear/node-client';

import { Secret, App, UserConfiguration, Endpoint, Collaborator } from "./types";

function decodeApp(app: any): App {
  return {
    id: app.id,
    name: app.name,
    last_deployment_id: app.last_deployment_id,
    created_at: new Date(app.created_at),
    updated_at: new Date(app.updated_at),
    endpoints: app.endpoints,
  };
}

export class ControllerContainer<T extends BaseAPIClient> {
  protected CONTROLLER_URL = "/_controller";
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

  async deleteSecret(appName: string, secretName: string): Promise<void> {
    return this.fetchAPI("DELETE", `${this.CONTROLLER_URL}/secret`, {
      query: [["app_name", appName], ["secret_name", secretName]],
    });
  }

  async createApp(name: string): Promise<[App, UserConfiguration, Endpoint]> {
    return this.fetchAPI("POST", `${this.CONTROLLER_URL}/app`, {
      json: { name },
    }).then(({ app, tenant_config, endpoint }) => {
      return [decodeApp(app), tenant_config.user_config, endpoint] as [
        App,
        UserConfiguration,
        Endpoint
      ];
    });
  }

  async getApps(): Promise<App[]> {
    return this.fetchAPI("GET", `${this.CONTROLLER_URL}/apps`).then(
      ({ apps }) => {
        return apps.map(decodeApp);
      }
    );
  }

  async getAppByName(appName: string): Promise<App> {
    return this.fetchAPI("GET", `/_controller/app/${appName}`).then(({ app }) =>
      decodeApp(app)
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

  async getCollaborators(appName: string): Promise<Collaborator[]> {
    return this.fetchAPI(
      "GET",
      `${this.CONTROLLER_URL}/app/${appName}/collaborators`
    ).then(({ collaborators }) => collaborators);
  }

  async addCollaborator(appName: string, email: string): Promise<boolean> {
    return this.fetchAPI("POST", `${this.CONTROLLER_URL}/app/${appName}/collaborator`, {
      json: {
        email: email,
      },
    }).then(({ invitation }) => {
      // false means user is added to the app directly
      // true means invitation is sent
      return !!invitation;
    });
  }

  async removeCollaborator(appName: string, userID: string): Promise<void> {
    return this.fetchAPI(
      "DELETE",
      `${this.CONTROLLER_URL}/app/${appName}/collaborator/${userID}`
    );
  }
}
