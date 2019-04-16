import { CLIContext } from '../types';
import {
  CloudCodeConfig,
  createCloudCodeRequestPayloadFromConfig,
} from '../types/cloudCodeConfig';
import { callAPI } from './skygear';

export async function createCloudCode(
  context: CLIContext,
  name: string,
  cloudCode: CloudCodeConfig,
  artifactID: string,
) {
  return callAPI(context, '/_controller/cloud_code', 'POST', {
    app_name: context.app,
    ...createCloudCodeRequestPayloadFromConfig(name, cloudCode, artifactID),
  });
}
