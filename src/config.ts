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
import { Dictionary, PropertyPath } from "lodash";
import _get from "lodash/get";
import _set from "lodash/set";
import path from "path";
import untildify from "untildify";

import { AppConfig, GlobalConfig } from "./types";
import { createGlobalConfig } from "./configUtil";
import { configPath } from "./path";

const currentConfigVersion = 1;

export enum ConfigDomain {
  GlobalDomain = "global",
  ProjectDomain = "project",
}

const configPaths: { [domain: string]: string } = {
  global: configPath("config"),
  project: "./skygear.yaml",
};

function migrate(configObject: Dictionary<any>) {
  const migrated = Object.assign({}, configObject);
  if (typeof migrated.version === "undefined") {
    migrated.version = currentConfigVersion;
  }

  // If we have new config version in the future, migrate the config object
  // from previous config version to the current one here.

  return migrated;
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

export function load(domain: ConfigDomain = ConfigDomain.GlobalDomain) {
  let content = {};

  const configPath = findConfig(domain);
  if (configPath) {
    content = yaml.safeLoad(fs.readFileSync(configPath, "utf-8"));
  }

  return content;
}

export function save(
  configObject: Dictionary<any>,
  domain: ConfigDomain = ConfigDomain.GlobalDomain
) {
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

export function set(
  name: PropertyPath,
  value: any,
  domain: ConfigDomain = ConfigDomain.GlobalDomain
) {
  const configObject = load(domain);
  const oldValue = _get(configObject, name);
  if (value !== oldValue) {
    _set(configObject, name, value);
    save(configObject, domain);
  }
}

export function loadConfig() {
  let globalConfig = load(ConfigDomain.GlobalDomain) as GlobalConfig;
  if (!Object.keys(globalConfig).length) {
    globalConfig = createGlobalConfig();
  }

  const appConfig = migrate(load(ConfigDomain.ProjectDomain)) as AppConfig;
  return {
    appConfig,
    globalConfig,
  };
}

export const developerMode = process.env.SKYCLI_DEVELOPER_MODE === "1";
