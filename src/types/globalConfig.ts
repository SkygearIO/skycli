import { ClusterConfig } from './clusterConfig';

const defaultContext = 'default';

interface ConfigContext {
    cluster: string;
    user: string;
}

function createConfigContext(): ConfigContext {
    return {
        cluster:  defaultContext,
        user:  defaultContext
    };
}

interface ClusterConfigMap { [s: string]: ClusterConfig; }
interface ContextMap { [s: string]: ConfigContext; }

export interface GlobalConfig {
    cluster: ClusterConfigMap;
    context: ContextMap;
    currentContext: string;
}

export function createGlobalConfig(clusterConfig: ClusterConfig): GlobalConfig {
    return {
        cluster: {
            [defaultContext]: clusterConfig
        },
        context: {
            [defaultContext]: createConfigContext()
        },
        currentContext: defaultContext
    };
}
