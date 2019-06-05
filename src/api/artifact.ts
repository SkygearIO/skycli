import { ReadStream } from 'fs';
import fetch, { RequestInit } from 'node-fetch';
import { CLIContext } from '../types';
import {
  Checksum,
  CreateArtifactUploadsResponse,
  createArtifactUploadsResponseFromJSON,
  PresignedRequest
} from '../types/artifact';
import { callAPI } from './skygear';

export async function createArtifactUploads(
  context: CLIContext,
  checksums: Checksum[]
): Promise<CreateArtifactUploadsResponse> {
  return callAPI(context, '/_controller/artifact_upload', 'POST', {
    app_name: context.app,
    upload_requests: checksums.map((checksum) => {
      return {
        checksum_md5: checksum.md5,
        checksum_sha256: checksum.sha256
      };
    })
  }).then((payload) => {
    return createArtifactUploadsResponseFromJSON(payload.result);
  });
}

export async function uploadArtifact(
  req: PresignedRequest,
  checksumMD5: string,
  stream: ReadStream
): Promise<void> {
  const headers: { [name: string]: string } = req.headers
    .map((header) => header.split(':'))
    .reduce((acc, curr) => ({ ...acc, [curr[0]]: curr[1] }), {});

  const opt: RequestInit = {
    method: req.method
  };

  headers['Content-MD5'] = checksumMD5;
  opt.headers = headers;

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
export async function createArtifacts(
  context: CLIContext,
  artifactRequest: string[]
): Promise<string[]> {
  return callAPI(context, '/_controller/artifact', 'POST', {
    app_name: context.app,
    artifact_requests: artifactRequest
  }).then((payload) => {
    return payload.result.artifacts.map((a: { id: string }) => a.id);
  });
}
