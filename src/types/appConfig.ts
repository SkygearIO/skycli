import { DeploymentItemConfig, HookConfig } from './deploymentItemConfig';

export interface AppConfig {
  app: string;
  deployments: { [name: string]: DeploymentItemConfig };
  hooks: HookConfig[];
}
