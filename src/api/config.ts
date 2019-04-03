import { createEmptyCLIContext } from '../types/cliContext';
import { ClusterConfig, clusterConfigFromJSON, createClusterConfig } from '../types/clusterConfig';
import { callAPI } from './skygear';

export async function getConfig(endpoint: string, apiKey: string): Promise<ClusterConfig> {
  const context = createEmptyCLIContext();
  context.cluster = createClusterConfig(endpoint, apiKey);
  return callAPI(context, '/_controller/config', 'GET').then((payload) => {
    return clusterConfigFromJSON(payload.result);
  });
}
