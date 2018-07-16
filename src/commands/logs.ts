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

import queryString, { parse } from 'query-string';
import WebSocket from 'ws';

import {
  defaultLogColorizer,
  noColorLogColorizer
} from './logging/coloring';

import {
  jsonLogFormatter,
  keyValueLogFormatter,
  LogFormatter,
  simpleLogFormatter
} from './logging/formatting';

import { controller } from '../api';
import { Arguments, createCommand } from '../util';

function parseLogStream(line: string): { [_: string]: any } {
  const logData = JSON.parse(line) as {[_: string]: any};
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

function handleLogData(
  logFormatter: LogFormatter,
  logData?: {[_: string]: any} | null,
): void {
  const filtered = {
    ...logData,
    pod: undefined,
    structured: undefined
  };

  console.log(logFormatter(filtered));
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

      const logColorizer = ((options) => {
        if (options['no-color']) {
          return noColorLogColorizer;
        }

        return defaultLogColorizer;
      })(argv);

      const colorizedLogFormatter = (({ format }) => {
        if (format === 'simple') {
          return simpleLogFormatter;
        }

        if (format === 'json') {
          return jsonLogFormatter;
        }

        return keyValueLogFormatter;
      })(argv);

      const logHandleFunc = handleLogData.bind(
        null,
        colorizedLogFormatter.bind(null, logColorizer) as LogFormatter
      );

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
        choices: ['key-value', 'simple', 'json'],
        default: 'key-value'
      });
  },
  handler: run
});
