import { isArray } from 'util';

type CloudCodeHook = CloudCodeHookConfig;

interface CloudCodeHookConfig {
  event: string;
  async: boolean;
  timeout: number;
  path: string;
}

function createCloudCodeHookRequestPayload(hook?: CloudCodeHook) {
  if (hook == null) {
    return undefined;
  }

  return {
    async: hook.async,
    event: hook.event,
    path: hook.path || '',
    timeout: hook.timeout
  };
}

export interface DeploymentItemConfig {
  type: string;
  path?: string;
  hook?: CloudCodeHook;
  env: string;
  entry: string;
  src: string;
  secrets: string[];
}

export function createDeploymentItemRequestPayloadFromConfig(
  deployment: DeploymentItemConfig
) {
  return {
    config: {},
    entry: deployment.entry,
    env: deployment.env,
    hook: createCloudCodeHookRequestPayload(deployment.hook),
    path: deployment.path,
    secrets: deployment.secrets,
    type: deployment.type
  };
}
