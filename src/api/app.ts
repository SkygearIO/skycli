import { CLIContext, TenantConfig, tenantConfigFromJSON } from '../types';
import { callAPI } from './skygear';

export async function createApp(
  context: CLIContext,
  appName: string
): Promise<{
  config: TenantConfig;
  endpoint: string;
}> {
  return callAPI(context, '/_controller/app', 'POST', {
    name: appName
  }).then((payload) => {
    const result = payload.result;
    return {
      config: tenantConfigFromJSON(result.tenant_config),
      endpoint: result.endpoint
    };
  });
}
