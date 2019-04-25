import { isArray } from 'util';

type CloudCodeHook = CloudCodeHookConfig | CloudCodeHookConfig[];

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

  if (!isArray(hook)) {
    hook = [hook];
  }

  return hook.map((h) => ({
    async: h.async,
    event: h.event,
    timeout: h.timeout,
    trigger_path: h.path || ''
  }));
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
  name: string,
  cloudCode: CloudCodeConfig,
  artifactID: string
) {
  interface HTTPTriggerConfigPayload {
    src_path: string;
  }

  let triggerType: string;
  let triggerConfig: HTTPTriggerConfigPayload | undefined;
  if (cloudCode.type === 'http-handler') {
    triggerType = 'http';
    triggerConfig = {
      src_path: cloudCode.path
    };
  }

  return {
    artifact_id: artifactID,
    config: {},
    entry_point: cloudCode.entry,
    environment: cloudCode.env,
    hook: createCloudCodeHookRequestPayload(cloudCode.hook),
    name,
    secrets: cloudCode.secrets,
    trigger_config: triggerConfig,
    trigger_type: triggerType,
    type: cloudCode.type
  };
}
