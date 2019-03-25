import { ClusterConfig } from './clusterConfig';
import { User } from './user';

export interface CLIContext {
    cluster: ClusterConfig;
    user: User;
    // todo: app config
}
