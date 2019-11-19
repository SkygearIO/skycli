import mime from "mime";
import fs from "fs-extra";
import { Response } from "node-fetch";
import {
  BaseAPIClient,
  decodeError,
  NodeContainer,
  NodeAPIClient,
} from "@skygear/node-client";

import { ControllerContainer } from "./ControllerContainer";
import {
  Deployment,
  DeploymentItemsMap,
  DeploymentItemConfig,
  HookConfig,
  LogEntry,
  Artifact,
} from "./types";

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

  async uploadArtifact(archivePath: string): Promise<string> {
    const stats = await fs.stat(archivePath);
    const fileSizeInBytes = stats.size;

    const stream = fs.createReadStream(archivePath);
    return ((this.container as any) as NodeContainer<
      NodeAPIClient
    >).asset.upload(stream, {
      access: "private",
      prefix: "artifact-",
      size: fileSizeInBytes,
      headers: {
        "content-type": "application/gzip",
      },
    });
  }

  // createArtifact returns artifact id if success
  async createArtifacts(
    appName: string,
    artifacts: Artifact[]
  ): Promise<string[]> {
    return this.fetchAPI("POST", `${this.CONTROLLER_URL}/artifact`, {
      json: {
        app_name: appName,
        artifacts: artifacts,
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

  async uploadTemplate(filePath: string): Promise<string> {
    const headers: { [name: string]: string } = {};
    const mediaType = mime.getType(filePath);
    if (mediaType != null) {
      headers["content-type"] = mediaType;
    }
    const buffer = fs.readFileSync(filePath);
    const asset_name = await ((this.container as any) as NodeContainer<
      NodeAPIClient
    >).asset.upload(buffer, {
      access: "private",
      prefix: "template-",
      size: buffer.length,
      headers,
    });

    return `asset-gear:///${asset_name}`;
  }
}
