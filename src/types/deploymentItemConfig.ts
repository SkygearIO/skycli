interface CloudCodeHookConfig {
  event: string;
  async: boolean;
  timeout: number;
  path: string;
}

export interface DeploymentItemConfig {
  type: string;
  path?: string;
  hook?: CloudCodeHookConfig;
  runtime_environment: string;
  entry: string;
  src: string;
  secrets: string[];
}

function createCloudCodeHookRequestPayload(hook?: CloudCodeHookConfig) {
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

export function createDeploymentItemRequestPayloadFromConfig(
  deployment: DeploymentItemConfig
) {
  return {
    config: {},
    entry: deployment.entry,
    runtime_environment: deployment.runtime_environment,
    hook: createCloudCodeHookRequestPayload(deployment.hook),
    path: deployment.path,
    secrets: deployment.secrets,
    type: deployment.type
  };
}
