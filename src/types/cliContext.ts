import { ClusterConfig } from './clusterConfig';
import { User } from './user';

export interface CLIContext {
  cluster: ClusterConfig;
  user: User;
  app: string;
}

export function createEmptyCLIContext(): CLIContext {
  return {
    app: null,
    cluster: null,
    user: null
  };
}
