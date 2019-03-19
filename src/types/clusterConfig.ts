export interface ClusterConfig {
    env: string;
    endpoint: string;
    apiKey: string;
}

// tslint:disable-next-line:no-any
export function createClusterConfig(input: any): ClusterConfig {
    if (!input || !input.env) {
        throw Error('Invalid cluster config.');
    }
    return {
        apiKey: input.apiKey,
        endpoint: input.endpoint,
        env: input.env
    };
}
