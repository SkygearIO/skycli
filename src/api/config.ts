import {
  ClusterConfig,
  clusterConfigFromJSON,
  createClusterConfig,
  createEmptyCLIContext
} from '../types';
import { callAPI } from './skygear';

export async function getConfig(endpoint: string, apiKey: string): Promise<ClusterConfig> {
  const context = createEmptyCLIContext();
  context.cluster = createClusterConfig(endpoint, apiKey);
  return callAPI(context, '/_controller/config', 'GET').then((payload) => {
    return clusterConfigFromJSON(payload.result);
  });
}
