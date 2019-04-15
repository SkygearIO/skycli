export interface TenantConfig {
  apiKey: string;
  masterKey: string;
}

// tslint:disable-next-line:no-any
export function tenantConfigFromJSON(input: any): TenantConfig {
  return {
    apiKey: input.API_KEY,
    masterKey: input.MASTER_KEY
  };
}
