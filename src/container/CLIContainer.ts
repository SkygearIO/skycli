import { ReadStream } from 'fs';
import fetch, { Response, RequestInit } from 'node-fetch';
import { BaseAPIClient, decodeError } from '@skygear/node-client';

import { ControllerContainer } from './ControllerContainer';
import {
  Deployment,
  DeploymentItemsMap,
  CreateArtifactUploadResponse,
  Checksum,
  PresignedRequest,
  DeploymentItemConfig,
  HookConfig,
  LogEntry
} from './types';

function encodeDeploymentItemConfig(deployment: DeploymentItemConfig): any {
  switch (deployment.type) {
    case 'http-handler':
      return {
        type: deployment.type,
        path: deployment.path,
        secrets: deployment.secrets,
        src: deployment.src,
        entry: deployment.entry,
        runtime_environment: deployment.runtime_environment
      };
    case 'http-service':
      return {
        type: deployment.type,
        path: deployment.path,
        secrets: deployment.secrets,
        port: deployment.port,
        context: deployment.context,
        dockerfile: deployment.dockerfile,
        environment: deployment.environment
      };
    default:
      throw new Error('unexpected type');
  }
}

function encodeHook(hook: HookConfig): any {
  return {
    event: hook.event,
    path: hook.path || ''
  };
}

function encodeLogEntry(input: any): LogEntry {
  return {
    level: input.level,
    message: input.message,
    timestamp: input.timestamp && new Date(input.timestamp)
  };
}

export class CLIContainer<T extends BaseAPIClient> extends ControllerContainer<
  T
> {
  async getClusterEnv(): Promise<string> {
    return this.fetchAPI('GET', `${this.CONTROLLER_URL}/config`).then(
      ({ env }) => env
    );
  }

  async getExamples(): Promise<string[]> {
    return this.fetchAPI('GET', `${this.CONTROLLER_URL}/examples`).then(
      ({ examples }) => examples.map((e: any) => e.path)
    );
  }

  async downloadExample(exampleName: string): Promise<Response> {
    const resp = ((await this.container.fetch(
      `${this.CONTROLLER_URL}/example/download/${exampleName}.tar.gz`
    )) as any) as Response;
    if (resp.status !== 200) {
      const body = await resp.text();
      throw decodeError(body);
    }
    return resp;
  }

  async getDeployment(deploymentID: string): Promise<Deployment> {
    return this.fetchAPI('GET', `/_controller/deployment/${deploymentID}`).then(
      ({ deployment }) => deployment
    );
  }

  async getDeploymentItems(deploymentID: string): Promise<DeploymentItemsMap> {
    return this.fetchAPI(
      'GET',
      `${this.CONTROLLER_URL}/deployment/${deploymentID}/items`
    ).then(({ deployments }) => deployments);
  }

  async createArtifactUploads(
    appName: string,
    checksums: Checksum[]
  ): Promise<CreateArtifactUploadResponse[]> {
    return this.fetchAPI('POST', `${this.CONTROLLER_URL}/artifact_upload`, {
      json: {
        app_name: appName,
        upload_requests: checksums.map((checksum) => {
          return {
            checksum_md5: checksum.md5,
            checksum_sha256: checksum.sha256
          };
        })
      }
    }).then(({ upload_requests }) => {
      return upload_requests.map((r: any) => {
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
    });
  }

  async uploadArtifact(
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
  async createArtifacts(
    appName: string,
    artifactRequest: string[]
  ): Promise<string[]> {
    return this.fetchAPI('POST', `${this.CONTROLLER_URL}/artifact`, {
      json: {
        app_name: appName,
        artifact_requests: artifactRequest
      }
    }).then(({ artifacts }) => {
      return artifacts.map((a: { id: string }) => a.id);
    });
  }

  async validateDeployment(
    appName: string,
    deployments: { [name: string]: DeploymentItemConfig },
    hooks: HookConfig[]
  ): Promise<void> {
    const encodedDeploymentItemConfigMap: { [key: string]: any } = {};
    Object.keys(deployments).map((key) => {
      encodedDeploymentItemConfigMap[key] = encodeDeploymentItemConfig(
        deployments[key]
      );
    });
    const encodedHooks = hooks.map(encodeHook);
    return this.fetchAPI('POST', '/_controller/deployment/validate', {
      json: {
        app_name: appName,
        deployments: encodedDeploymentItemConfigMap,
        hooks: encodedHooks
      }
    });
  }

  async createDeployment(
    appName: string,
    deployments: { [name: string]: DeploymentItemConfig },
    artifactIDs: { [name: string]: string },
    hooks: HookConfig[]
  ): Promise<string> {
    const encodedDeploymentItemConfigMap: { [key: string]: any } = {};
    Object.keys(deployments).map((key) => {
      encodedDeploymentItemConfigMap[key] = encodeDeploymentItemConfig(
        deployments[key]
      );
    });
    const encodedHooks = hooks.map(encodeHook);
    return this.fetchAPI('POST', `${this.CONTROLLER_URL}/deployment`, {
      json: {
        app_name: appName,
        artifact_ids: artifactIDs,
        deployments: encodedDeploymentItemConfigMap,
        hooks: encodedHooks,
        sync: true
      }
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
      resp.body
        .on('data', (data) => {
          count += data.length;
          data
            .toString('utf-8')
            .split('\r\n')
            .map((logJSON: string) => {
              if (logJSON) {
                const log = encodeLogEntry(JSON.parse(logJSON));
                onData(log);
              }
            });
        })
        .on('error', (err) => {
          reject(err);
        })
        .on('end', () => {
          const contentLength = resp.headers.get('content-length');
          const needReconnect = !contentLength;
          resolve({
            needReconnect,
            nextCur: cur + count
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
        method: 'POST',
        headers: {
          Range: `bytes=${cur}-`
        },
        mode: 'cors',
        credentials: 'include',
        body: JSON.stringify({
          deployment_id: deploymentID,
          type: 'deploy'
        })
      }
    )) as any) as Response;
    if (resp.status !== 200 && resp.status !== 206 && resp.status !== 416) {
      const jsonBody = await resp.json();
      throw decodeError(jsonBody['error'] || resp.statusText);
    }

    return resp;
  }
}
