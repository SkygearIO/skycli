import { CLIContext } from '../types';
import { CloudCode, cloudCodeFromJSON } from '../types/cloudCode';
import {
  CloudCodeConfig,
  createCloudCodeRequestPayloadFromConfig
} from '../types/cloudCodeConfig';
import { callAPI } from './skygear';

export async function createCloudCode(
  context: CLIContext,
  name: string,
  cloudCode: CloudCodeConfig,
  artifactID: string
): Promise<string> {
  return callAPI(context, '/_controller/cloud_code', 'POST', {
    app_name: context.app,
    ...createCloudCodeRequestPayloadFromConfig(name, cloudCode, artifactID)
  }).then((payload) => {
    return payload.result.cloud_code.id;
  });
}

export async function getCloudCode(
  context: CLIContext,
  cloudCodeID: string
): Promise<CloudCode> {
  return callAPI(context, `/_controller/cloud_code/${cloudCodeID}`, 'GET').then(
    (payload) => {
      return cloudCodeFromJSON(payload.result.cloud_code);
    }
  );
}
