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
import queryString, { parse } from 'query-string';
import sqlFormatter from 'sql-formatter';
import WebSocket from 'ws';

import { controller } from '../api';
import { Arguments, createCommand } from '../util';

type Logger = (logData: any) => string;
type LogColorizer = (...text: string[]) => (string | string[]);

function parseLogStream(line: string): any {
  const logData = JSON.parse(line);
  if (logData.structured !== undefined) {
    return logData;
  }

  // FIXME: remove the following when structured log is supported in piper
  const { msg } = logData;

  try {
    const parsed = JSON.parse(msg);
    return {
      ...logData,
      ...parsed,
      structured: true
    };
  } catch (e) {
    return {
      ...logData,
      structured: false
    };
  }
}

const keyvalueLogger: Logger = (logData) => {
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

  return detailsLog ? `\n${logLine}\n${detailsLog}\n` : `\n${logLine}\n`;
};

const simpleLogger: Logger = (logData) => {
  if (!logData.time) {
    return `                     | ${logData.msg}`;
  }

  return `${logData.time} | ${logData.msg}`;
};

const jsonLogger: Logger = (logData) => {
  return JSON.stringify(logData, null, 2);
};

function handleLogData(argv: Arguments, logger: Logger, logData: any): void {
  const filtered = {
    ...logData,
    pod: undefined,
    structured: undefined
  };

  const logColorizer: LogColorizer = ((level, options) => {
    const logNoColorizer: LogColorizer = (...args: string[]) => (
      args.length > 1 ? args : args[0]
    );

    if (options['no-color']) {
      return logNoColorizer;
    }

    if (level === 'debug') {
      return chalk.gray;
    }

    if (level === 'warning') {
      return chalk.yellow;
    }

    if (level === 'error') {
      return chalk.red;
    }

    if (level === 'critical') {
      return chalk.greenBright.bgRed;
    }

    return logNoColorizer;
  })(filtered.level, argv);

  console.log(logColorizer(logger(filtered)));
}

function makeLogStreamUrl(argv: Arguments, logStreamResult: any): string {
  const { token, websocket_url: webSocketUrl } = logStreamResult;

  const query = queryString.stringify({
    token,
    tail: argv.tail
  });

  return `${webSocketUrl}?${query}`;
}

function run(argv: Arguments) {
  const appName = argv.project.app;
  const token = argv.currentAccount.token;

  return controller.appLogStream(appName, token).then((result) => {
    const logUrl = makeLogStreamUrl(argv, result);
    if (argv.debug) {
      console.error(`Connecting to ${logUrl}.`);
    }

    return new Promise((resolve, reject) => {
      const ws = new WebSocket(logUrl);

      const colorizedLogger = ((format: string) => {
        if (format === 'simple') {
          return simpleLogger;
        }

        if (format === 'json') {
          return jsonLogger;
        }

        return keyvalueLogger;
      })(argv.format as string);

      const logHandleFunc = handleLogData.bind(null, argv, colorizedLogger);

      ws.on('open', () => {
        // Print message when connection opens.
        if (argv.debug) {
          console.error(`Connection opened to ${logUrl}.`);
        }
        console.error(`Streaming log for ${appName}...`);
      });

      ws.on('message', (data) => {
        // Handle received message which contains log data in stringified JSON.
        if (argv.debug) {
          console.error(`Received message: ${data}`);
        }
        try {
          logHandleFunc(parseLogStream(data as string));
        } catch (e) {
          ws.close();
          reject(e);
        }
      });

      ws.on('close', () => {
        // Resolve promise when the connection is closed.
        if (argv.debug) {
          console.error(`Connection closed from ${logUrl}.`);
        }
        resolve();
      });

      ws.on('error', (err) => {
        // Handle error and reject the promise.
        if (argv.debug) {
          console.error(`Error occurred with ${logUrl}: ${err}`);
        }
        reject(err);
      });
    });
  });
}

export default createCommand({
  command: 'logs',
  describe: 'Print console log of the app.',
  builder: (yargs) => {
    return yargs
      .option('tail', {
        type: 'number',
        desc: 'Number of lines to print from the end of the log',
        default: 0
      })
      .option('no-color', {
        type: 'boolean',
        default: false
      })
      .option('format', {
        type: 'string',
        desc: 'Show log in specific format',
        choices: ['keyvalue', 'simple', 'json'],
        default: 'keyvalue'
      });
  },
  handler: run
});
