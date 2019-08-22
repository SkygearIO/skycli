import { CLIContext } from '../types';
import { callAPI } from './skygear';

export async function getUserConfig(context: CLIContext): Promise<any> {
  return callAPI(
    context,
    `/_controller/userconfig?app_name=${context.app}`,
    'GET'
  ).then((payload) => {
    return payload.result.user_config;
  });
}
