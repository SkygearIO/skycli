import {
  CLIContext,
  cloudCodeFromJSON,
  createDeploymentItemRequestPayloadFromConfig,
  Deployment,
  deploymentFromJSON,
  DeploymentItemConfig,
  DeploymentItemsResponse
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

export async function getDeploymentItems(
  context: CLIContext,
  deploymentID: string
): Promise<DeploymentItemsResponse> {
  return callAPI(
    context,
    `/_controller/deployment/${deploymentID}/items`,
    'GET'
  ).then((payload) => {
    const cloudCodesJSON = payload.result.cloud_codes;
    return {
      cloudCodes: cloudCodesJSON.map(cloudCodeFromJSON)
    };
  });
}
