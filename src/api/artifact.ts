import { CLIContext } from '../types';
import {
  Checksum,
  CreateArtifactUploadResponse,
  createArtifactUploadResponseFromJSON,
} from '../types/artifact';
import { callAPI } from './skygear';

export async function createArtifactUpload(
  context: CLIContext,
  checksum: Checksum,
): Promise<CreateArtifactUploadResponse> {
  return callAPI(context, '/_controller/artifact_upload', 'POST', {
    app_name: context.app,
    checksum_md5: checksum.md5,
    checksum_sha256: checksum.sha256,
  }).then((payload) => {
    return createArtifactUploadResponseFromJSON(payload.result);
  });
}
