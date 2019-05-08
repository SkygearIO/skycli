import { ReadStream } from 'fs';
import fetch, { RequestInit } from 'node-fetch';
import { CLIContext } from '../types';
import {
  Checksum,
  CreateArtifactUploadResponse,
  createArtifactUploadResponseFromJSON,
  PresignedRequest
} from '../types/artifact';
import { callAPI } from './skygear';

export async function createArtifactUpload(
  context: CLIContext,
  checksum: Checksum
): Promise<CreateArtifactUploadResponse> {
  return callAPI(context, '/_controller/artifact_upload', 'POST', {
    app_name: context.app,
    checksum_md5: checksum.md5,
    checksum_sha256: checksum.sha256
  }).then((payload) => {
    return createArtifactUploadResponseFromJSON(payload.result);
  });
}

export async function uploadArtifact(
  req: PresignedRequest,
  checksumMD5: string,
  stream: ReadStream
): Promise<void> {
  const opt: RequestInit = {
    headers: req.headers
      .map((header) => header.split(':'))
      .reduce((acc, curr) => ({ ...acc, [curr[0]]: curr[1] }), {}),
    method: req.method
  };

  opt.headers['Content-MD5'] = checksumMD5;

  if (req.method === 'PUT') {
    // From https://github.com/bitinn/node-fetch#post-data-using-a-file-stream,
    // stream from fs.createReadStream should work.
    //
    // But the type definition does not match, so force type cast here.
    // tslint:disable-next-line: no-any
    opt.body = stream as any;
  } else {
    throw new Error(
      `uploadArtifact with method "${req.method}" not implemented`
    );
  }

  return fetch(req.url, opt).then((resp) => {
    if (resp.status !== 200) {
      throw new Error(`Fail to upload archive, ${resp.body.read()}`);
    }
  });
}

// createArtifact returns artifact id if success
export async function createArtifact(
  context: CLIContext,
  artifactRequest: string
): Promise<string> {
  return callAPI(context, '/_controller/artifact', 'POST', {
    app_name: context.app,
    artifact_request: artifactRequest
  }).then((payload) => {
    return payload.result.artifact.id;
  });
}
