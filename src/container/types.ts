export interface App {
  id: string;
  name: string;
  last_deployment_id?: string;
  created_at: Date;
  updated_at: Date;
  endpoints: string[];
}

export type SecretType = "opaque" | "dockerconfigjson";

export interface Secret {
  name: string;
  type: SecretType;
  created_at: string;
  updated_at: string;
}

export interface AppConfiguration {
  version: string;
  clients: { [id: string]: APIClientConfig };
  master_key?: string;
  welcome_email?: WelcomeEmailConfiguration;
  forgot_password?: ForgotPasswordConfiguration;
}

export interface APIClientConfig {
  api_key: string;
}

export interface WelcomeEmailConfiguration {
  enabled?: boolean;
  sender?: string;
  subject?: string;
  reply_to?: string;
}

export interface ForgotPasswordConfiguration {
  sender?: string;
  subject?: string;
  reply_to?: string;
}

export interface HttpServiceConfig {
  name: string;
  type: "http-service";
  path: string;
  port: number;
  context?: string;
  dockerfile?: string;
  environment?: Environment[];
  command?: string[];
  template?: string;
  image?: string;
  image_pull_secret?: string;
}

export interface Environment {
  name?: string;
  value?: string;
  secret?: string;
}

export interface StaticConfig {
  name: string;
  type: "static";
  path: string;
  context: string;
  fallback?: string;
  expires: number;
}

export interface HookConfig {
  event: string;
  path: string;
}

export type DeploymentItemConfig = HttpServiceConfig | StaticConfig;

export interface DeploymentItemArtifact {
  deploy_item_name: string;
  artifact_id: string;
}

// artifact related models
export interface Checksum {
  sha256: string;
  md5: string;
}

export interface ArtifactRequest {
  checksum_sha256: string;
  checksum_md5: string;
  asset_name: string;
}

export interface ArtifactResponse {
  id: string;
  checksum_sha256: string;
  checksum_md5: string;
  asset_name: string;
}

export interface LogEntry {
  level: string;
  message: string;
  timestamp: Date;
}

export enum DeploymentStatus {
  Pending = "Pending",
  Running = "Running",
  DeployFailed = "DeployFailed",
  Stopping = "Stopping",
  StopFailed = "StopFailed",
  Stopped = "Stopped",
}

export interface Deployment {
  id: string;
  status: DeploymentStatus;
}

export interface Collaborator {
  id: string;
  email: string;
}

export interface TemplateItem {
  type: string;
  digest: string;
  uri?: string;
  language_tag?: string;
  key?: string;
}

export interface LocalTemplateItem extends TemplateItem {
  filePath: string;
}

export interface TemplateSpec {
  type: string;
  default?: string;
  is_keyed: boolean;
  is_html: boolean;
}

export interface RemoteTemplateItem extends TemplateItem {
  signed_uri: string;
}

export interface ListTemplateResponse {
  specs: Record<string, TemplateSpec[]>;
  items: RemoteTemplateItem[];
}

export interface CustomDomain {
  id: string;
  app_id: string;
  domain: string;
  verified: boolean;
  connected: boolean;
  dns_records: DNSRecord[];
  created_at: string;
  updated_at: string;
  verified_at?: string;
  created_by: string;
  updated_by: string;
  verified_by?: string;
  root_domain_id: string;
  redirect_domain?: string;
  tls_secret_id?: string;
  tls_secret_expiry?: string;
}

export interface RootDomain {
  id: string;
  app_id: string;
  domain: string;
  verified: boolean;
  dns_records: DNSRecord[];
  created_at: string;
  verified_at?: string;
  created_by: string;
  verified_by?: string;
}

export type DNSRecordType = "A" | "TXT";
export interface DNSRecord {
  host: string;
  type: DNSRecordType;
  value: string;
}

export interface CustomDomainResponse {
  custom_domain: CustomDomain;
  root_domain: RootDomain;
}

export interface CustomDomainsResponse {
  custom_domains: CustomDomain[];
  root_domains: RootDomain[];
}

export interface SkygearYAML {
  version?: string;
  app?: string;
  deployments?: DeploymentItemConfig[];
  hooks?: HookConfig[];
}
