export interface App {
  id: string;
  name: string;
  lastDeploymentID: string;
}

// tslint:disable-next-line:no-any
export function appFromJSON(input: any): App {
  return {
    id: input.id,
    lastDeploymentID: input.last_deployment_id,
    name: input.name
  };
}
