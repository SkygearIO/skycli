import { ClusterConfig } from './clusterConfig';
import { User } from './user';

export interface Config {
    cluster: ClusterConfig;
    user: User;
    // todo: app config
}
