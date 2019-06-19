import fetch, { Response } from 'node-fetch';
import url from 'url';

import { CLIContext } from '../types';

function defaultHeaders(context: CLIContext) {
  return {
    Accept: 'application/json',
    'Content-Type': 'application/json',
    'X-Skygear-API-Key': (context.cluster && context.cluster.apiKey) || '',
    'X-Skygear-Access-Token': (context.user && context.user.accessToken) || ''
  };
}

// tslint:disable-next-line:no-any
export async function handleFailureResponse(response: Response): Promise<any> {
  // By default, we use statusText as error message
  // This is a fallback only.
  const preparedError = new Error(response.statusText);
  // Attach response to error
  (preparedError as any).response = response;

  try {
    // Attach json to error
    const json = await response.json();
    (preparedError as any).json = json;
    // Use skyerr message if available
    if (json && json.error && json.error.message) {
      preparedError.message = json.error.message;
    }
  } catch {}
  throw preparedError;
}

export function callAPI(
  context: CLIContext,
  path: string,
  method: string,
  // tslint:disable-next-line:no-any
  data?: any
  // tslint:disable-next-line:no-any
): Promise<any> {
  const endpoint = context.cluster && context.cluster.endpoint;
  if (!endpoint) {
    return Promise.reject(new Error('no endpoint'));
  }
  return fetch(url.resolve(endpoint, path), {
    body: data && JSON.stringify(data),
    headers: defaultHeaders(context),
    method
  }).then((response) => {
    if (response.status === 200) {
      return response.json();
    }
    return handleFailureResponse(response);
  });
}
