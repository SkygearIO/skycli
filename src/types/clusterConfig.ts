export interface ClusterConfig {
    env: string;
    endpoint: string;
}

// tslint:disable-next-line:no-any
export function createClusterConfig(input: any): ClusterConfig {
    if (!input || !input.env) {
        throw Error('Invalid cluster config.');
    }
    return {
        endpoint: input.endpoint,
        env: input.env
    };
}
