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

import chalk from 'chalk';

export type LogColorizer = (logData: any, msg: string) => string;

export const noColorLogColorizer: LogColorizer = (logData, msg) => msg;

export const defaultLogColorizer: LogColorizer = ({ level }, msg) => {
  if (level === 'debug') {
    return chalk.gray(msg);
  }

  if (level === 'warning') {
    return chalk.yellow(msg);
  }

  if (level === 'error') {
    return chalk.red(msg);
  }

  if (level === 'critical') {
    return chalk.greenBright.bgRed(msg);
  }

  return noColorLogColorizer(null, msg);
};
