import {
  CLIContext,
  createDeploymentItemRequestPayloadFromConfig,
  Deployment,
  deploymentFromJSON,
  DeploymentItemConfig
} from '../types';
import { callAPI } from './skygear';

export async function createDeployment(
  context: CLIContext,
  deployments: { [name: string]: DeploymentItemConfig },
  artifactIDs: { [name: string]: string }
): Promise<string> {
  const deploymentsRequestPayload = {};
  Object.keys(deployments).map((key) => {
    deploymentsRequestPayload[
      key
    ] = createDeploymentItemRequestPayloadFromConfig(deployments[key]);
  });
  return callAPI(context, '/_controller/deployment', 'POST', {
    app_name: context.app,
    artifact_ids: artifactIDs,
    deployments: deploymentsRequestPayload,
    sync: true
  }).then((payload) => {
    return payload.result.deployment.id;
  });
}

export async function getDeployment(
  context: CLIContext,
  deploymentID: string
): Promise<Deployment> {
  return callAPI(
    context,
    `/_controller/deployment/${deploymentID}`,
    'GET'
  ).then((payload) => {
    return deploymentFromJSON(payload.result.deployment);
  });
}
