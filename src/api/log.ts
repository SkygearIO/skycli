import fetch from 'node-fetch';
import url from 'url';
import { CLIContext } from '../types';

export async function downloadDeployLog(
  context: CLIContext,
  cloudCodeID: string
) {
  const endpoint = context.cluster && context.cluster.endpoint;
  if (!endpoint) {
    return Promise.reject(new Error('no endpoint'));
  }
  return fetch(url.resolve(endpoint, `/_controller/log/download`), {
    body: JSON.stringify({
      cloud_code_id: cloudCodeID,
      type: 'deploy'
    }),
    headers: {
      'X-Skygear-API-Key': (context.cluster && context.cluster.apiKey) || '',
      'X-Skygear-Access-Token': (context.user && context.user.accessToken) || ''
    },
    method: 'POST'
  }).then((resp) => {
    if (resp.status !== 200) {
      resp.text().then((t) => console.log(t));
      throw new Error(`Fail to download deploy log of ${cloudCodeID}`);
    }

    return resp;
  });
}
