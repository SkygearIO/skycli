export interface ClusterConfig {
  env: string;
  endpoint: string;
  apiKey: string;
}

export function createClusterConfig(
  endpoint: string,
  apiKey: string
): ClusterConfig {
  return {
    apiKey,
    endpoint,
    env: null
  };
}

// tslint:disable-next-line:no-any
export function clusterConfigFromJSON(input: any): ClusterConfig {
  if (!input || !input.env) {
    throw Error(`Invalid cluster config: ${input}`);
  }
  return {
    apiKey: input.apiKey,
    endpoint: input.endpoint,
    env: input.env
  };
}
