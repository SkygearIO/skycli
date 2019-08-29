import { Response } from 'node-fetch';
import { BaseAPIClient } from '@skygear/node-client';

import { ControllerContainer } from './ControllerContainer';
import { makeHTTPError } from '../error';

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
      const httpError = await makeHTTPError(resp);
      throw httpError;
    }
    return resp;
  }
}
