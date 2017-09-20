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
import _ from 'lodash';
import fs from 'fs-extra';
import untildify from 'untildify';
import path from 'path';

const currentConfigVersion = 1;

export const GlobalDomain = 'global';
export const LocalDomain = 'local';
export const ProjectDomain = 'project';

const configPaths = {
  global: '~/.skycli/skyclirc',
  local: './.skycli/skyclirc',
  project: './skygear.json'
};

function migrate(configObject) {
  const migrated = _.assign({}, configObject);
  if (typeof migrated.version === 'undefined') {
    migrated.version = currentConfigVersion;
  }

  // If we have new config version in the future, migrate the config object
  // from previous config version to the current one here.

  return migrated;
}

function isGlobalConfigPath(configPath) {
  const globalConfigPath = path.resolve(untildify(configPaths[GlobalDomain]));
  return globalConfigPath === configPath;
}

function findConfig(domain, exists = true) {
  const configPath = untildify(configPaths[domain]);
  const absolute = path.isAbsolute(configPath);

  var currentDir = process.cwd();
  var fullPath = absolute ? configPath : path.resolve(currentDir, configPath);
  if (!exists) {
    return fullPath;
  }

  // If the config path is not already an absolute path, recursively
  // find the config file until we find an existing one.
  while (!absolute && currentDir !== path.dirname(currentDir)) {
    fullPath = path.resolve(currentDir, configPath);
    if (fs.existsSync(fullPath)) {
      if (domain === LocalDomain && isGlobalConfigPath(fullPath)) {
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

export function load(domain = GlobalDomain) {
  let content = {};

  const configPath = findConfig(domain);
  if (configPath) {
    content = JSON.parse(
      fs.readFileSync(configPath, 'utf-8')
    );
  }

  return migrate(content);
}

export function save(configObject, domain = GlobalDomain) {
  var configPath = findConfig(domain);
  if (!configPath) {
    configPath = findConfig(domain, false);
    fs.ensureDirSync(path.dirname(configPath));
  }

  const content = JSON.stringify(configObject, null, 2);
  fs.writeFileSync(configPath, content);
}

export function set(name, value, domain = GlobalDomain) {
  let configObject = load(domain);
  let oldValue = _.get(configObject, name);
  if (value !== oldValue) {
    _.set(configObject, name, value);
    save(configObject, domain);
  }
}

export function unset(name, domain = GlobalDomain) {
  set(name, undefined, domain);
}

export function loadLocal() {
  return load(LocalDomain);
}

export function saveLocal(configObject) {
  return save(configObject, LocalDomain);
}

export function setLocal(name, value) {
  return set(name, value, LocalDomain);
}

export function unsetLocal(name) {
  return unset(name, LocalDomain);
}

export function loadProject() {
  return load(ProjectDomain);
}

export function saveProject(configObject) {
  return save(configObject, ProjectDomain);
}

export function setProject(name, value) {
  return set(name, value, ProjectDomain);
}

export function unsetProject(name) {
  return unset(name, ProjectDomain);
}

export const developerMode = process.env.SKYCLI_DEVELOPER_MODE === '1';
