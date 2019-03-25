import fetch from 'node-fetch';
import url from 'url';

import { ClusterConfig, createClusterConfig } from '../types/clusterConfig';
import { User, userFromJSON } from '../types/user';

import { CLIContext } from '../types/cliContext';
import { handleFailureResponse } from './error';

function defaultHeaders(config?: CLIContext) {
  return {
    'Accept': 'application/json',
    'Content-Type': 'application/json',
    'X-Skygear-API-Key': (config && config.cluster.apiKey) || ''
  };
}

export async function getConfig(endpoint: string, apiKey: string): Promise<ClusterConfig> {
  return fetch(url.resolve(endpoint, '/_controller/config'), {
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

export async function signupWithEmail(
  config: CLIContext, email: string, password: string
): Promise<User> {
  return fetch(url.resolve(config.cluster.endpoint, '/_auth/signup'), {
    body: JSON.stringify({
      auth_data: {
        email
      },
      password
    }),
    headers: {
      ...defaultHeaders(config)
    },
    method: 'POST'
  }).then((response) => {
    if (response.status === 200) {
      return response.json();
    } else {
      return handleFailureResponse(response);
    }
  }).then((payload) => {
    return userFromJSON(payload.result);
  });
}
