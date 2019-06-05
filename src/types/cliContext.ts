import { ClusterConfig } from './clusterConfig';
import { User } from './user';

export interface CLIContext {
  cluster: ClusterConfig | null;
  user: User | null;
  app: string | null;
}

export function createEmptyCLIContext(): CLIContext {
  return {
    app: null,
    cluster: null,
    user: null
  };
}
