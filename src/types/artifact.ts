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
  input: any
): CreateArtifactUploadResponse {
  return {
    uploadRequest: {
      method: input.upload_request.method,
      url: input.upload_request.url,
      fields: input.upload_request.fields,
      headers: input.upload_request.headers
    },
    artifactRequest: input.artifact_request
  };
}
