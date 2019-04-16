export interface CloudCodeConfig {
  type: string;
  path: string;
  env: string;
  entry: string;
  src: string | string[];
}

export function createCloudCodeRequestPayloadFromConfig(
  name: string,
  cloudCode: CloudCodeConfig,
  artifactID: string,
) {
  let triggerType: string;
  let triggerConfig: any;
  if (cloudCode.type === 'http-handler') {
    triggerType = 'http';
    triggerConfig = {
      src_path: cloudCode.path,
    };
  }

  return {
    name,
    type: cloudCode.type,
    trigger_type: triggerType,
    trigger_config: triggerConfig,
    config: {},
    artifact_id: artifactID,
    environment: cloudCode.env,
    entry_point: cloudCode.entry,
  };
}
