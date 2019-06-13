import {
  CLIContext,
  createDeploymentItemRequestPayloadFromConfig,
  createHookRequestPayload,
  Deployment,
  Deployments,
  deploymentFromJSON,
  DeploymentItemConfig,
  HookConfig
} from '../types';
import { callAPI } from './skygear';

export async function createDeployment(
  context: CLIContext,
  deployments: { [name: string]: DeploymentItemConfig },
  artifactIDs: { [name: string]: string },
  hooks: HookConfig[]
): Promise<string> {
  const deploymentsRequestPayload: {
    [key: string]: ReturnType<
      typeof createDeploymentItemRequestPayloadFromConfig
    >;
  } = {};
  Object.keys(deployments).map((key) => {
    deploymentsRequestPayload[
      key
    ] = createDeploymentItemRequestPayloadFromConfig(deployments[key]);
  });
  const hooksRequestPayload = hooks.map((h) => {
    return createHookRequestPayload(h);
  });
  return callAPI(context, '/_controller/deployment', 'POST', {
    app_name: context.app,
    artifact_ids: artifactIDs,
    deployments: deploymentsRequestPayload,
    hooks: hooksRequestPayload,
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
): Promise<{ deployments: Deployments }> {
  return callAPI(
    context,
    `/_controller/deployment/${deploymentID}/items`,
    'GET'
  ).then((payload) => {
    return payload.result;
  });
}
