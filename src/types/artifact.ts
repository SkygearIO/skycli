export interface Checksum {
  sha256: string;
  md5: string;
}

export interface PresignedRequest {
  method: string;
  url: string;
  fields: { [name: string]: string };
  headers: string[];
}

export interface CreateArtifactUploadResponse {
  uploadRequest: PresignedRequest;
  artifactRequest: string;
}

export type CreateArtifactUploadsResponse = CreateArtifactUploadResponse[];

export function createArtifactUploadsResponseFromJSON(
  // tslint:disable-next-line: no-any
  input: any
): CreateArtifactUploadsResponse {
  return input.upload_requests.map((r: any) => {
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
