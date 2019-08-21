export interface ClusterConfig {
  env: string | null;
  endpoint: string;
  api_key: string;
}

export function createClusterConfig(
  endpoint: string,
  apiKey: string
): ClusterConfig {
  return {
    api_key: apiKey,
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
    api_key: input.api_key,
    endpoint: input.endpoint,
    env: input.env
  };
}
