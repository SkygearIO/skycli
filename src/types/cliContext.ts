import { ClusterConfig } from './clusterConfig';
import { User, Identity } from '@skygear/node-client';

export interface UserContext {
  user: User;
  identity: Identity;
  access_token: string;
}
export interface CLIContext {
  cluster: ClusterConfig | null;
  user: UserContext | null;
  app: string | null;
  debug: boolean;
  verbose: boolean;
}

export function createEmptyCLIContext(): CLIContext {
  return {
    app: null,
    cluster: null,
    debug: false,
    user: null,
    verbose: false
  };
}
