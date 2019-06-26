export interface TenantConfig {
  version: string;
  user_config: {
    api_key: string;
    master_key: string;
  };
}
