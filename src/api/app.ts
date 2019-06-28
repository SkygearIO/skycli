import { App, appFromJSON, CLIContext, TenantConfig } from '../types';
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
      config: result.tenant_config,
      endpoint: result.endpoint
    };
  });
}

export async function getApps(context: CLIContext): Promise<App[]> {
  return callAPI(context, '/_controller/apps', 'GET').then((payload) => {
    const result = payload.result.apps;
    return result.map(appFromJSON);
  });
}

export async function getAppByName(
  context: CLIContext,
  appName: string
): Promise<App> {
  return callAPI(context, `/_controller/app/${appName}`, 'GET').then(
    (payload) => {
      const result = payload.result.app;
      return appFromJSON(result);
    }
  );
}
