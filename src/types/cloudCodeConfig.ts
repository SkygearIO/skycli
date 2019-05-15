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

export interface CloudCodeConfig {
  type: string;
  path?: string;
  hook?: CloudCodeHook;
  env: string;
  entry: string;
  src: string;
  secrets: string[];
}

export function createCloudCodeRequestPayloadFromConfig(
  cloudCode: CloudCodeConfig
) {
  return {
    config: {},
    entry: cloudCode.entry,
    env: cloudCode.env,
    hook: createCloudCodeHookRequestPayload(cloudCode.hook),
    path: cloudCode.path,
    secrets: cloudCode.secrets,
    type: cloudCode.type
  };
}
