import { CLIContext, Secret, secretFromJSON } from '../types';
import { callAPI } from './skygear';

export async function getSecrets(context: CLIContext): Promise<Secret[]> {
  return callAPI(
    context,
    `/_controller/secrets?app_name=${context.app}`,
    'GET'
  ).then((payload) => {
    const result = payload.result.secrets;
    return result ? result.map(secretFromJSON) : [];
  });
}

export async function createSecret(
  context: CLIContext,
  secretName: string,
  secretValue: string
): Promise<Secret> {
  return callAPI(context, `/_controller/secret`, 'POST', {
    app_name: context.app || '',
    secret_name: secretName,
    secret_value: secretValue
  }).then((payload) => {
    const result = payload.result.secret;
    return secretFromJSON(result);
  });
}

export async function renameSecret(
  context: CLIContext,
  oldSecretName: string,
  newSecretName: string
): Promise<void> {
  return callAPI(context, `/_controller/secret/rename`, 'POST', {
    app_name: context.app,
    new_secret_name: newSecretName,
    old_secret_name: oldSecretName
  });
}

export async function deleteSecret(
  context: CLIContext,
  secretName: string
): Promise<void> {
  return callAPI(
    context,
    `/_controller/secret?app_name=${context.app}&secret_name=${secretName}`,
    'DELETE'
  );
}
