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
import findUp from 'find-up';
import _ from 'lodash';
import fs from 'fs';
import untildify from 'untildify';

const rcPathList = [
  './.skyclirc',
  './.skycli/skyclirc',
  '~/.skyclirc',
  '~/.skycli/skyclirc'
];

function findConfigPath() {
  let cwd = process.cwd();
  return findUp.sync(rcPathList, { cwd });
}

export function load() {
  let rcConfig = {};
  let rcPath = findConfigPath();

  if (rcPath) {
    rcConfig = JSON.parse(
      fs.readFileSync(rcPath, 'utf-8')
    );
  }

  return rcConfig;
}

export function save(rcConfig) {
  let content = JSON.stringify(rcConfig, null, 2);
  let rcPath = findConfigPath();
  if (!rcPath) {
    rcPath = untildify(rcPathList[rcPathList.length - 1]);

    // Make sure the directory exists
    const configDir = untildify('~/.skycli/');
    if (!fs.existsSync(configDir)) {
      fs.mkdirSync(configDir);
    }
  }
  fs.writeFileSync(rcPath, content);
}

export function set(name, value) {
  let rcConfig = load();
  _.set(rcConfig, name, value);
  save(rcConfig);
}

export function unset(name) {
  set(name, undefined);
}
