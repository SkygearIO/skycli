import fetch from 'node-fetch';
import url from 'url';
import { CLIContext } from '../types';

export async function downloadDeployLog(
  context: CLIContext,
  cloudCodeID: string
) {
  return fetch(url.resolve(context.cluster.endpoint, `/_controller/log/download`), {
    body: JSON.stringify({
      type: 'deploy',
      cloud_code_id: cloudCodeID,
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
