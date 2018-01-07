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
import WebSocket from 'ws';
import queryString from 'query-string';

import { controller } from '../api';
import { createCommand } from '../util';

function handleLogData(logData) {
  const {
    msg: message
  } = logData;
  console.log(message);
}

function makeLogStreamUrl(argv, logStreamResult) {
  const {
    token,
    websocket_url: webSocketUrl
  } = logStreamResult;

  const query = queryString.stringify({
    token,
    tail: argv.tail
  });

  return `${webSocketUrl}?${query}`;
}

function run(argv) {
  const appName = argv.project.app;
  const token = argv.currentAccount.token;

  return controller.appLogStream(appName, token)
    .then((result) => {
      const logUrl = makeLogStreamUrl(argv, result);
      if (argv.debug) {
        console.log(`Connecting to ${logUrl}.`);
      }

      return new Promise((resolve, reject) => {
        const ws = new WebSocket(logUrl);

        ws.on('open', () => {
          // Print message when connection opens.
          if (argv.debug) {
            console.log(`Connection opened to ${logUrl}.`);
          }
          console.log(`Streaming log for ${appName}...`);
        });

        ws.on('message', (data) => {
          // Handle received message which contains log data in stringified JSON.
          if (argv.debug) {
            console.log(`Received message: ${data}`);
          }
          try {
            handleLogData(JSON.parse(data));
          } catch (e) {
            ws.close();
            reject(e);
          }
        });

        ws.on('close', () => {
          // Resolve promise when the connection is closed.
          if (argv.debug) {
            console.log(`Connection closed from ${logUrl}.`);
          }
          resolve();
        });

        ws.on('error', (err) => {
          // Handle error and reject the promise.
          if (argv.debug) {
            console.log(`Error occurred with ${logUrl}: ${err}`);
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
        type: 'integer',
        desc: 'Number of lines to print from the end of the log',
        default: 0
      });
  },
  handler: run
});
