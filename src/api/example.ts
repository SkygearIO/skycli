import fetch from 'node-fetch';
import url from 'url';
import { CLIContext } from '../types';
import { callAPI } from './skygear';

export async function getExamples(context: CLIContext): Promise<string[]> {
  return callAPI(context, '/_controller/examples', 'GET').then((payload) => {
    const result = payload.result.examples;
    return result.map((e: any) => e.path);
  });
}

export async function downloadExample(
  context: CLIContext,
  exampleName: string
) {
  const endpoint = context.cluster && context.cluster.endpoint;
  if (!endpoint) {
    return Promise.reject(new Error('no endpoint'));
  }
  const dlURL = url.resolve(
    endpoint,
    `/_controller/example/download/${exampleName}.tar.gz`
  );
  return fetch(dlURL).then((resp) => {
    if (resp.status !== 200) {
      throw new Error(`Fail to download ${exampleName}.tar.gz`);
    }
    return resp;
  });
}
