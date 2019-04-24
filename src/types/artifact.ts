export interface Checksum {
  sha256: string;
  md5: string;
}

export interface CreateArtifactUploadResponse {
  uploadRequest: PresignedRequest;
  artifactRequest: string;
}

export interface PresignedRequest {
  method: string;
  url: string;
  fields: { [name: string]: string };
  headers: string[];
}

export function createArtifactUploadResponseFromJSON(
  // tslint:disable-next-line: no-any
  input: any
): CreateArtifactUploadResponse {
  return {
    artifactRequest: input.artifact_request,
    uploadRequest: {
      fields: input.upload_request.fields,
      headers: input.upload_request.headers,
      method: input.upload_request.method,
      url: input.upload_request.url
    }
  };
}
