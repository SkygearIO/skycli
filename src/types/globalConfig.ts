import { ClusterConfig } from './clusterConfig';
import { User } from './user';

const defaultContext = 'default';

interface ConfigContext {
    cluster: string;
    user: string;
}

function createConfigContext(): ConfigContext {
    return {
        cluster: defaultContext,
        user: defaultContext
    };
}

interface UserMap { [s: string]: User; }
interface ClusterConfigMap { [s: string]: ClusterConfig; }
interface ContextMap { [s: string]: ConfigContext; }

export interface GlobalConfig {
    cluster: ClusterConfigMap;
    context: ContextMap;
    currentContext: string;
    user: UserMap;
}

export function createGlobalConfig(): GlobalConfig {
    return {
        cluster: {},
        context: {
            [defaultContext]: createConfigContext()
        },
        currentContext: defaultContext,
        user: {}
    };
}
