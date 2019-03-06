import fetch from 'node-fetch';
import url from 'url';

import { ClusterConfig, createClusterConfig } from '../types';
import { handleFailureResponse } from './error';

function defaultHeaders(token?: string) {
  return {
    'Accept': 'application/json',
    'Authorization': token ? '' : `JWT ${token}`,
    'Content-Type': 'application/json'
  };
}

export function getConfig(endpoint: string): Promise<ClusterConfig> {
  return fetch(url.resolve(endpoint, '/config'), {
    headers: {
      ...defaultHeaders()
    },
    method: 'GET'
  }).then((response) => {
    if (response.status === 200) {
      return response.json();
    } else {
      return handleFailureResponse(response);
    }
  }).then((payload) => {
    return createClusterConfig(payload.result);
  });
}
