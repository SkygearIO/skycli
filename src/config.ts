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
import fs from 'fs-extra';
import _, { Dictionary, PropertyPath } from 'lodash';
import path from 'path';
import untildify from 'untildify';

const currentConfigVersion = 1;

export enum ConfigDomain {
  GlobalDomain = 'global',
  LocalDomain = 'local',
  ProjectDomain = 'project'
}

const configPaths: { [domain: string]: string } = {
  global: '~/.skycli/skyclirc',
  local: './.skycli/skyclirc',
  project: './skygear.json'
};

function migrate(configObject: Dictionary<any>) {
  const migrated = _.assign({}, configObject);
  if (typeof migrated.version === 'undefined') {
    migrated.version = currentConfigVersion;
  }

  // If we have new config version in the future, migrate the config object
  // from previous config version to the current one here.

  return migrated;
}

function isGlobalConfigPath(configPath: string) {
  const globalConfigPath = path.resolve(
    untildify(configPaths[ConfigDomain.GlobalDomain])
  );
  return globalConfigPath === configPath;
}

function findConfig(domain: ConfigDomain, exists: boolean = true) {
  const configPath = untildify(configPaths[domain]);
  const absolute = path.isAbsolute(configPath);

  let currentDir = process.cwd();
  let fullPath = absolute ? configPath : path.resolve(currentDir, configPath);
  if (!exists) {
    return fullPath;
  }

  // If the config path is not already an absolute path, recursively
  // find the config file until we find an existing one.
  while (!absolute && currentDir !== path.dirname(currentDir)) {
    fullPath = path.resolve(currentDir, configPath);
    if (fs.existsSync(fullPath)) {
      if (domain === ConfigDomain.LocalDomain && isGlobalConfigPath(fullPath)) {
        // We are looking for local config, but we only find the global
        // one, meaning local config doesn't exist.
        return undefined;
      }
      return fullPath;
    }
    currentDir = path.dirname(currentDir);
  }

  fullPath = path.resolve(currentDir, configPath);
  return fs.existsSync(fullPath) ? fullPath : undefined;
}

export function load(domain: ConfigDomain = ConfigDomain.GlobalDomain) {
  let content = {};

  const configPath = findConfig(domain);
  if (configPath) {
    content = JSON.parse(fs.readFileSync(configPath, 'utf-8'));
  }

  return migrate(content);
}

export function save(
  configObject: Dictionary<any>,
  domain: ConfigDomain = ConfigDomain.GlobalDomain
) {
  let configPath = findConfig(domain);
  if (!configPath) {
    configPath = findConfig(domain, false);
    fs.ensureDirSync(path.dirname(configPath));
  }

  const content = JSON.stringify(configObject, null, 2);
  fs.writeFileSync(configPath, content);
}

export function set(
  name: PropertyPath,
  value: any,
  domain: ConfigDomain = ConfigDomain.GlobalDomain
) {
  const configObject = load(domain);
  const oldValue = _.get(configObject, name);
  if (value !== oldValue) {
    _.set(configObject, name, value);
    save(configObject, domain);
  }
}

export function unset(
  name: PropertyPath,
  domain: ConfigDomain = ConfigDomain.GlobalDomain
) {
  set(name, undefined, domain);
}

export function loadLocal() {
  return load(ConfigDomain.LocalDomain);
}

export function saveLocal(configObject: Dictionary<any>) {
  return save(configObject, ConfigDomain.LocalDomain);
}

export function setLocal(name: PropertyPath, value: any) {
  return set(name, value, ConfigDomain.LocalDomain);
}

export function unsetLocal(name: PropertyPath) {
  return unset(name, ConfigDomain.LocalDomain);
}

export function loadProject() {
  return load(ConfigDomain.ProjectDomain);
}

export function saveProject(configObject: Dictionary<any>) {
  return save(configObject, ConfigDomain.ProjectDomain);
}

export function setProject(name: PropertyPath, value: any) {
  return set(name, value, ConfigDomain.ProjectDomain);
}

export function unsetProject(name: PropertyPath) {
  return unset(name, ConfigDomain.ProjectDomain);
}

export const developerMode = process.env.SKYCLI_DEVELOPER_MODE === '1';
