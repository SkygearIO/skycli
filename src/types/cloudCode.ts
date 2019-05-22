export enum CloudCodeStatus {
  Pending = 'Pending',
  Running = 'Running',
  DeployFailed = 'DeployFailed',
  Stopped = 'Stopped',
  StopFailed = 'StopFailed'
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
