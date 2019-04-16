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
