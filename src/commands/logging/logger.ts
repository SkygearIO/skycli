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

import sqlFormatter from 'sql-formatter';

import { LogColorizer } from './coloring';

export type Logger = (logData: any) => string;

export type ColorizedLogger =
  (logColorizer: LogColorizer, logData: any) => string;

export const keyvalueLogger: ColorizedLogger = (logColorizer, logData) => {
  const logLine = Object.keys(logData)
    .map((eachKey) => ({key: eachKey, value: logData[eachKey]}))
    .map(({key, value}) => `${key}=${JSON.stringify(value)}`)
    .join(' ');
  const detailsLog = (({ sql, error }) => {
    if (sql) {
      // Remove the redundant spaces after '$'
      return sqlFormatter.format(sql).replace(/\$\s+/g, '$');
    }

    if (error) {
      return error;
    }

    return;
  })(logData);

  return logColorizer(
    logData,
    detailsLog ?
      `\n${logLine}\n${detailsLog}\n` :
      `\n${logLine}\n`
  );
};

export const simpleLogger: ColorizedLogger = (logColorizer, logData) => {
  if (!logData.time) {
    return logColorizer(logData, `                     | ${logData.msg}`);
  }

  return logColorizer(logData, `${logData.time} | ${logData.msg}`);
};

export const jsonLogger: ColorizedLogger = (logColorizer, logData) => {
  return logColorizer(logData, JSON.stringify(logData, null, 2));
};
