export enum DeploymentStatus {
  Pending = 'Pending',
  Running = 'Running',
  DeployFailed = 'DeployFailed',
  Stopping = 'Stopping',
  StopFailed = 'StopFailed',
  Stopped = 'Stopped'
}

export interface Deployment {
  id: string;
  status: DeploymentStatus;
}

// tslint:disable-next-line:no-any
export function deploymentFromJSON(input: any): Deployment {
  return {
    id: input.id,
    status: input.status
  };
}
