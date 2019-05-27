import { DeploymentItemConfig } from './deploymentItemConfig';

export interface AppConfig {
  app: string;
  deployments: { [name: string]: DeploymentItemConfig };
}
