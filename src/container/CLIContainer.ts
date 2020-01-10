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
  ArtifactRequest,
  ArtifactResponse,
  DeploymentItemArtifact,
  Deployment,
  DeploymentItemConfig,
  LogEntry,
  SkygearYAML,
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
    return this.fetchAPI("GET", `${this.CONTROLLER_URL}/configs`).then(
      ({ env }) => env
    );
  }

  async getDeployment(
    appName: string,
    deploymentID: string
  ): Promise<Deployment> {
    return this.fetchAPI(
      "GET",
      `${this.CONTROLLER_URL}/apps/${appName}/deployments/${deploymentID}`
    ).then(({ deployment }) => deployment);
  }

  async getDeploymentItems(
    appName: string,
    deploymentID: string
  ): Promise<DeploymentItemConfig[]> {
    return this.fetchAPI(
      "GET",
      `${this.CONTROLLER_URL}/apps/${appName}/deployments/${deploymentID}/items`
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
    artifacts: ArtifactRequest[]
  ): Promise<ArtifactResponse[]> {
    return this.fetchAPI(
      "POST",
      `${this.CONTROLLER_URL}/apps/${appName}/artifacts`,
      {
        json: {
          artifacts: artifacts,
        },
      }
    ).then(({ artifacts }) => {
      return artifacts;
    });
  }

  async validateDeployment(
    appName: string,
    skygearYAML: SkygearYAML
  ): Promise<void> {
    return this.fetchAPI(
      "POST",
      `${this.CONTROLLER_URL}/apps/${appName}/deployment_validations`,
      {
        json: skygearYAML,
      }
    );
  }

  async createDeployment(
    appName: string,
    skygearYAML: SkygearYAML,
    artifacts: DeploymentItemArtifact[]
  ): Promise<string> {
    return this.fetchAPI(
      "POST",
      `${this.CONTROLLER_URL}/apps/${appName}/deployments`,
      {
        json: {
          ...skygearYAML,
          artifacts,
          sync: true,
        },
      }
    ).then(({ deployment }) => {
      return deployment.id;
    });
  }

  async downloadDeployLog(
    appName: string,
    deploymentID: string,
    onData: (log: LogEntry) => void,
    cur: number = 0
  ): Promise<void> {
    const resp = await this.sendDownloadLogRequest(appName, deploymentID, cur);
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
      return this.downloadDeployLog(
        appName,
        deploymentID,
        onData,
        result.nextCur
      );
    }
  }

  async sendDownloadLogRequest(
    appName: string,
    deploymentID: string,
    cur: number
  ): Promise<Response> {
    const resp = ((await this.container.fetch(
      `${this.CONTROLLER_URL}/apps/${appName}/deployments/${deploymentID}/logs`,
      {
        method: "POST",
        headers: {
          Range: `bytes=${cur}-`,
          "content-type": "application/json",
        },
        mode: "cors",
        credentials: "include",
        body: JSON.stringify({
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
      `${this.CONTROLLER_URL}/deployment_templates/${template}`
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
