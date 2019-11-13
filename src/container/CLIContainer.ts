import fs from "fs-extra";
import fetch, { Response, RequestInit } from "node-fetch";
import { BaseAPIClient, decodeError } from "@skygear/node-client";

import { ControllerContainer } from "./ControllerContainer";
import {
  Deployment,
  DeploymentItemsMap,
  CreateArtifactUploadResponse,
  Checksum,
  PresignedRequest,
  DeploymentItemConfig,
  HookConfig,
  LogEntry,
} from "./types";

const FormData = require("form-data");

function encodeLogEntry(input: any): LogEntry {
  return {
    level: input.level,
    message: input.message,
    timestamp: input.timestamp && new Date(input.timestamp),
  };
}

export class CLIContainer<T extends BaseAPIClient> extends ControllerContainer<
  T
> {
  async getClusterEnv(): Promise<string> {
    return this.fetchAPI("GET", `${this.CONTROLLER_URL}/config`).then(
      ({ env }) => env
    );
  }

  async getDeployment(deploymentID: string): Promise<Deployment> {
    return this.fetchAPI("GET", `/_controller/deployment/${deploymentID}`).then(
      ({ deployment }) => deployment
    );
  }

  async getDeploymentItems(deploymentID: string): Promise<DeploymentItemsMap> {
    return this.fetchAPI(
      "GET",
      `${this.CONTROLLER_URL}/deployment/${deploymentID}/items`
    ).then(({ deployments }) => deployments);
  }

  async createArtifactUploads(
    appName: string,
    checksums: Checksum[]
  ): Promise<CreateArtifactUploadResponse[]> {
    return this.fetchAPI("POST", `${this.CONTROLLER_URL}/artifact_upload`, {
      json: {
        app_name: appName,
        upload_requests: checksums.map(checksum => {
          return {
            checksum_md5: checksum.md5,
            checksum_sha256: checksum.sha256,
          };
        }),
      },
    }).then(({ upload_requests }) => {
      return upload_requests.map((r: any) => {
        return {
          artifactRequest: r.artifact_request,
          uploadRequest: {
            fields: r.upload_request.fields,
            headers: r.upload_request.headers,
            method: r.upload_request.method,
            url: r.upload_request.url,
          },
        };
      });
    });
  }

  async uploadArtifact(
    req: PresignedRequest,
    checksumMD5: string,
    archivePath: string
  ): Promise<void> {
    const headers: { [name: string]: string } = (req.headers || [])
      .map(header => header.split(":"))
      .reduce((acc, curr) => ({ ...acc, [curr[0]]: curr[1] }), {});

    const opt: RequestInit = {
      method: req.method,
    };

    const stats = await fs.stat(archivePath);
    const fileSizeInBytes = stats.size;

    const stream = fs.createReadStream(archivePath);

    headers["Content-MD5"] = checksumMD5;

    if (req.method === "PUT") {
      headers["Content-Length"] = `${fileSizeInBytes}`;
      // From https://github.com/bitinn/node-fetch#post-data-using-a-file-stream,
      // stream from fs.createReadStream should work.
      //
      // But the type definition does not match, so force type cast here.
      // tslint:disable-next-line: no-any
      opt.body = stream as any;
    } else if (req.method === "POST") {
      const formData = new FormData();
      formData.append("file", stream, {
        knownLength: fileSizeInBytes,
      });

      const fields = req.fields || {};
      for (const key of Object.keys(fields)) {
        formData.append(key, fields[key]);
      }
      opt.body = formData;
    } else {
      throw new Error(
        `uploadArtifact with method "${req.method}" not implemented`
      );
    }

    opt.headers = headers;

    return fetch(req.url, opt).then(resp => {
      if (resp.status !== 200 && resp.status !== 204) {
        throw new Error(`Fail to upload archive, ${resp.body.read()}`);
      }
    });
  }

  // createArtifact returns artifact id if success
  async createArtifacts(
    appName: string,
    artifactRequest: string[]
  ): Promise<string[]> {
    return this.fetchAPI("POST", `${this.CONTROLLER_URL}/artifact`, {
      json: {
        app_name: appName,
        artifact_requests: artifactRequest,
      },
    }).then(({ artifacts }) => {
      return artifacts.map((a: { id: string }) => a.id);
    });
  }

  async validateDeployment(
    appName: string,
    deployments: { [name: string]: DeploymentItemConfig },
    hooks: HookConfig[]
  ): Promise<void> {
    return this.fetchAPI("POST", "/_controller/deployment/validate", {
      json: {
        app_name: appName,
        deployments: deployments as any,
        hooks: hooks as any,
      },
    });
  }

  async createDeployment(
    appName: string,
    deployments: { [name: string]: DeploymentItemConfig },
    artifactIDs: { [name: string]: string },
    hooks: HookConfig[]
  ): Promise<string> {
    return this.fetchAPI("POST", `${this.CONTROLLER_URL}/deployment`, {
      json: {
        app_name: appName,
        artifact_ids: artifactIDs,
        deployments: deployments as any,
        hooks: hooks as any,
        sync: true,
      },
    }).then(({ deployment }) => {
      return deployment.id;
    });
  }

  async downloadDeployLog(
    deploymentID: string,
    onData: (log: LogEntry) => void,
    cur: number = 0
  ): Promise<void> {
    const resp = await this.sendDownloadLogRequest(deploymentID, cur);
    if (resp.status === 416) {
      return;
    }
    const result: {
      needReconnect: boolean;
      nextCur: number;
    } = await new Promise((resolve, reject) => {
      let count = 0;
      let buffer = "";
      const consumeBuffer = () => {
        const lastDelimiterIndex = buffer.lastIndexOf("\n");
        const jsons = buffer.slice(0, lastDelimiterIndex);
        buffer = buffer.slice(lastDelimiterIndex);

        for (let json of jsons.split("\n")) {
          json = json.trim();
          if (!json) continue;
          const log = encodeLogEntry(JSON.parse(json));
          onData(log);
        }
      };

      resp.body
        .on("data", data => {
          count += data.length;
          buffer += data.toString("utf-8");
          consumeBuffer();
        })
        .on("error", err => {
          reject(err);
        })
        .on("end", () => {
          buffer += "\n";
          consumeBuffer();

          const contentLength = resp.headers.get("content-length");
          const needReconnect = !contentLength;
          resolve({
            needReconnect,
            nextCur: cur + count,
          });
        });
    });

    if (result.needReconnect) {
      return this.downloadDeployLog(deploymentID, onData, result.nextCur);
    }
  }

  async sendDownloadLogRequest(
    deploymentID: string,
    cur: number
  ): Promise<Response> {
    const resp = ((await this.container.fetch(
      `${this.CONTROLLER_URL}/log/download`,
      {
        method: "POST",
        headers: {
          Range: `bytes=${cur}-`,
          "content-type": "application/json",
        },
        mode: "cors",
        credentials: "include",
        body: JSON.stringify({
          deployment_id: deploymentID,
          type: "deploy",
        }),
      }
    )) as any) as Response;
    if (resp.status !== 200 && resp.status !== 206 && resp.status !== 416) {
      const jsonBody = await resp.json();
      throw decodeError(jsonBody["error"] || resp.statusText);
    }

    return resp;
  }

  async downloadTemplate(template: string): Promise<Response> {
    const resp = ((await this.container.fetch(
      `${this.CONTROLLER_URL}/deployment/template/${template}`
    )) as any) as Response;
    if (resp.status !== 200) {
      const jsonBody = await resp.json();
      throw decodeError(jsonBody["error"] || resp.statusText);
    }
    return resp;
  }
}
