import fetch, { Response } from 'node-fetch';
import url from 'url';
import { CLIContext, LogEntry, logEntryFromJSON } from '../types';
import { handleFailureResponse } from './skygear';

export async function downloadDeployLog(
  context: CLIContext,
  deploymentID: string,
  onData: (log: LogEntry) => void,
  cur: number = 0
): Promise<void> {
  const resp = await sendDownloadLogRequest(context, deploymentID, cur);
  if (resp.status === 416) {
    if (context.debug) {
      console.log('Reached the end of the log...');
    }
    return;
  }
  const result: { needReconnect: boolean; nextCur: number } = await new Promise(
    (resolve, reject) => {
      let count = 0;
      resp.body
        .on('data', (data) => {
          count += data.length;
          data
            .toString('utf-8')
            .split('\r\n')
            .map((logJSON: string) => {
              if (logJSON) {
                const log = logEntryFromJSON(JSON.parse(logJSON));
                onData(log);
              }
            });
        })
        .on('error', (err) => {
          reject(err);
        })
        .on('end', () => {
          const contentLength = resp.headers.get('content-length');
          const needReconnect = !contentLength;
          resolve({
            needReconnect,
            nextCur: cur + count
          });
        });
    }
  );

  if (result.needReconnect) {
    if (context.debug) {
      console.log('Reconnect...');
    }
    return downloadDeployLog(context, deploymentID, onData, result.nextCur);
  }
  if (context.debug) {
    console.log('Done...');
  }
}

export async function sendDownloadLogRequest(
  context: CLIContext,
  deploymentID: string,
  cur: number
): Promise<Response> {
  const endpoint = context.cluster && context.cluster.endpoint;
  if (!endpoint) {
    return Promise.reject(new Error('no endpoint'));
  }
  return fetch(url.resolve(endpoint, `/_controller/log/download`), {
    body: JSON.stringify({
      deployment_id: deploymentID,
      type: 'deploy'
    }),
    headers: {
      Range: `bytes=${cur}-`,
      'X-Skygear-API-Key': (context.cluster && context.cluster.api_key) || '',
      'X-Skygear-Access-Token':
        (context.user && context.user.access_token) || ''
    },
    method: 'POST'
  }).then((response) => {
    if (
      response.status !== 200 &&
      response.status !== 206 &&
      response.status !== 416
    ) {
      return handleFailureResponse(response);
    }

    return response;
  });
}
