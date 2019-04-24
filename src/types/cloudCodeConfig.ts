export interface CloudCodeConfig {
  type: string;
  path: string;
  env: string;
  entry: string;
  src: string;
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
    name,
    trigger_config: triggerConfig,
    trigger_type: triggerType,
    type: cloudCode.type
  };
}
