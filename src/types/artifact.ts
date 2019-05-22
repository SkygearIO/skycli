export interface Checksum {
  sha256: string;
  md5: string;
}

export interface CreateArtifactUploadResponse {
  uploadRequest: PresignedRequest;
  artifactRequest: string;
}

export type CreateArtifactUploadsResponse = CreateArtifactUploadResponse[];

export interface PresignedRequest {
  method: string;
  url: string;
  fields: { [name: string]: string };
  headers: string[];
}

export function createArtifactUploadsResponseFromJSON(
  // tslint:disable-next-line: no-any
  input: any
): CreateArtifactUploadsResponse {
  return input.upload_requests.map((r) => {
    return {
      artifactRequest: r.artifact_request,
      uploadRequest: {
        fields: r.upload_request.fields,
        headers: r.upload_request.headers,
        method: r.upload_request.method,
        url: r.upload_request.url
      }
    };
  });
}
