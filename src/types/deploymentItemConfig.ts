export type DeploymentItemType = 'http-handler' | 'http-service';

export interface HttpHandlerConfig {
  type: 'http-handler';
  path: string;
  hook?: HookConfig;
  runtime_environment: string;
  entry: string;
  src: string;
  secrets: string[];
}

export interface HttpServiceConfig {
  type: 'http-service';
  path: string;
  port: number;
  context: string;
  dockerfile?: string;
  secrets: string[];
  environment: { [name: string]: string };
}

export interface HookConfig {
  event: string;
  async: boolean;
  timeout: number;
  path: string;
}

export type DeploymentItemConfig = HttpHandlerConfig | HttpServiceConfig;

export interface HookConfigPayload {
  event: string;
  async: boolean;
  timeout: number;
  path: string;
}

export interface DeploymentItemConfigPayload {
  // Common fields
  type: DeploymentItemType;
  path: string;
  secrets: string[];
  // http-handler
  entry?: string;
  hook?: HookConfigPayload;
  runtime_environment?: string;
  src?: string;
  // http-service
  port?: number;
  context?: string;
  dockerfile?: string;
  environment?: { [name: string]: string };
}

export function createHookRequestPayload(
  hook?: HookConfig
): HookConfigPayload | undefined {
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
): DeploymentItemConfigPayload {
  const payload: DeploymentItemConfigPayload = {
    type: deployment.type,
    path: deployment.path,
    secrets: deployment.secrets
  };
  switch (deployment.type) {
    case 'http-handler':
      payload.src = deployment.src;
      payload.entry = deployment.entry;
      payload.hook = createHookRequestPayload(deployment.hook);
      payload.runtime_environment = deployment.runtime_environment;
      break;
    case 'http-service':
      payload.port = deployment.port;
      payload.context = deployment.context;
      payload.dockerfile = deployment.dockerfile;
      payload.environment = deployment.environment;
      break;
    default:
      throw new Error('unexpected type');
  }
  return payload;
}
