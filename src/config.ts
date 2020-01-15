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
import fs from "fs-extra";
import * as yaml from "js-yaml";
import { PropertyPath } from "lodash";
import _get from "lodash/get";
import _set from "lodash/set";
import path from "path";
import untildify from "untildify";

import { SkygearYAML } from "./container/types";
import { ClusterConfig, SkycliConfig, ClusterUserConfig } from "./types";
import { configPath } from "./path";

export type ConfigDomain = "global" | "project";

const defaultContext = "default";
const configVersion = "v1";

const configPaths: { [domain: string]: string } = {
  global: configPath("config"),
  project: "./skygear.yaml",
};

export function createSkycliConfig(): SkycliConfig {
  return {
    api_version: configVersion,
  };
}

export function createSkycliConfigWithClusterConfig(
  cluster: ClusterConfig
): SkycliConfig {
  return {
    api_version: configVersion,
    clusters: [
      {
        name: defaultContext,
        cluster,
      },
    ],
    contexts: [
      {
        name: defaultContext,
        context: {
          cluster: defaultContext,
          user: defaultContext,
        },
      },
    ],
    current_context: defaultContext,
  };
}

function findConfig(
  domain: ConfigDomain,
  exists: boolean = true
): string | undefined {
  const configPath = untildify(configPaths[domain]);
  const absolute = path.isAbsolute(configPath);

  const currentDir = process.cwd();
  let fullPath = absolute ? configPath : path.resolve(currentDir, configPath);
  if (!exists) {
    return fullPath;
  }

  fullPath = path.resolve(currentDir, configPath);
  return fs.existsSync(fullPath) ? fullPath : undefined;
}

export function load(domain: ConfigDomain): object | undefined {
  const configPath = findConfig(domain);
  if (configPath) {
    return yaml.safeLoad(fs.readFileSync(configPath, "utf-8"));
  }
  return undefined;
}

export function save(configObject: object, domain: ConfigDomain) {
  let configPath = findConfig(domain);
  if (!configPath) {
    configPath = findConfig(domain, false);
    if (configPath) {
      fs.ensureDirSync(path.dirname(configPath));
    }
  }

  const content = yaml.safeDump(configObject);
  if (configPath) {
    fs.writeFileSync(configPath, content);
  }
}

export function set(name: PropertyPath, value: any, domain: ConfigDomain) {
  const configObject = load(domain) ?? {};
  const oldValue = _get(configObject, name);
  if (value !== oldValue) {
    _set(configObject, name, value);
    save(configObject, domain);
  }
}

export function migrateSkycliConfig(c: { [key: string]: any }): SkycliConfig {
  if (c.api_version === configVersion) {
    return c as SkycliConfig;
  }

  const clusters: SkycliConfig["clusters"] = [];
  const users: SkycliConfig["users"] = [];
  const contexts: SkycliConfig["contexts"] = [];

  if (c.cluster != null) {
    for (const name of Object.keys(c.cluster)) {
      clusters.push({
        name,
        cluster: c.cluster[name],
      });
    }
  }

  if (c.user != null) {
    for (const name of Object.keys(c.user)) {
      users.push({
        name,
        user: c.user[name],
      });
    }
  }

  if (c.context != null) {
    for (const name of Object.keys(c.context)) {
      contexts.push({
        name,
        context: c.context[name],
      });
    }
  }

  const skycliConfig: SkycliConfig = {
    api_version: configVersion,
  };
  if (clusters.length > 0) {
    skycliConfig.clusters = clusters;
  }
  if (users.length > 0) {
    skycliConfig.users = users;
  }
  if (contexts.length > 0) {
    skycliConfig.contexts = contexts;
  }
  if (c.current_context != null) {
    skycliConfig.current_context = c.current_context;
  }
  return skycliConfig;
}

export function loadConfig(): {
  skygearYAML?: SkygearYAML;
  skycliConfig: SkycliConfig;
} {
  const loadedConfig = load("global");

  let skycliConfig: SkycliConfig;
  if (loadedConfig == null) {
    skycliConfig = createSkycliConfig();
  } else {
    skycliConfig = migrateSkycliConfig(loadedConfig);
  }

  // Migrated; Save the migrated config.
  if (loadedConfig != null && skycliConfig !== loadedConfig) {
    save(skycliConfig, "global");
  }

  const skygearYAML = load("project") as SkygearYAML;
  return {
    skygearYAML,
    skycliConfig,
  };
}

export function updateUser(
  skycliConfig: SkycliConfig,
  name: string,
  updater: (user: ClusterUserConfig) => ClusterUserConfig
): SkycliConfig {
  const users = skycliConfig.users ?? [];
  const idx = users.findIndex(u => u.name === name);

  if (idx != null && idx >= 0) {
    return {
      ...skycliConfig,
      users: skycliConfig.users?.map(u => {
        if (u.name === name) {
          return {
            ...u,
            user: updater(u.user),
          };
        }
        return u;
      }),
    };
  }

  return {
    ...skycliConfig,
    users: [
      ...users,
      {
        name,
        user: updater({} as any),
      },
    ],
  };
}

export function getUser(
  skycliConfig: SkycliConfig,
  name: string
): ClusterUserConfig | undefined {
  return skycliConfig.users?.find(u => u.name === name)?.user;
}

export function deleteUser(skycliConfig: SkycliConfig, name: string) {
  return {
    ...skycliConfig,
    users: skycliConfig.users?.filter(u => u.name !== name),
  };
}

export const developerMode = process.env.SKYCLI_DEVELOPER_MODE === "1";
