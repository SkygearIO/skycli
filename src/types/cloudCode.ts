export enum CloudCodeStatus {
  Pending = 'pending',
  Running = 'running',
  DeployFailed = 'deploy failed',
  Stopping = 'stopping',
  Stopped = 'stopped'
}

export interface CloudCode {
  id: string;
  name: string;
  status: CloudCodeStatus;
}

// tslint:disable-next-line:no-any
export function cloudCodeFromJSON(input: any): CloudCode {
  return {
    id: input.id,
    name: input.name,
    status: input.status
  };
}
