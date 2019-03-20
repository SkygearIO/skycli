import { CLIContext, createEmptyCLIContext } from '../types/cliContext';
import { ClusterConfig, clusterConfigFromJSON, createClusterConfig } from '../types/clusterConfig';
import { User, userFromJSON } from '../types/user';
import { callAPI } from './skygear';

export async function getConfig(endpoint: string, apiKey: string): Promise<ClusterConfig> {
  const context = createEmptyCLIContext();
  context.cluster = createClusterConfig(endpoint, apiKey);
  return callAPI(context, '/_controller/config', 'GET').then((payload) => {
    return clusterConfigFromJSON(payload.result);
  });
}

export async function signupWithEmail(
  context: CLIContext, email: string, password: string
): Promise<User> {
  return callAPI(context, '/_auth/signup', 'POST', {
    auth_data: {
      email
    },
    password
  }).then((payload) => {
    return userFromJSON(payload.result);
  });
}

export async function loginWithEmail(
  context: CLIContext, email: string, password: string
): Promise<User> {
  return callAPI(context, '/_auth/login', 'POST', {
    auth_data: {
      email
    },
    password
  }).then((payload) => {
    return userFromJSON(payload.result);
  });
}

export async function logout(context: CLIContext): Promise<void> {
  return callAPI(context, '/_auth/logout', 'POST');
}
