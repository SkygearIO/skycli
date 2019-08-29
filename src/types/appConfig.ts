import { DeploymentItemConfig, HookConfig } from '../container/types';

export interface AppConfig {
  app: string;
  deployments: { [name: string]: DeploymentItemConfig };
  hooks: HookConfig[];
}
