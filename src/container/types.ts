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
  created_at: Date;
  updated_at: Date;
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

export interface HttpHandlerConfig {
  type: "http-handler";
  path: string;
  runtime_environment: string;
  entry: string;
  src: string;
  secrets: string[];
}

export interface HttpServiceConfig {
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

export interface HookConfig {
  event: string;
  path: string;
}

export type DeploymentItemConfig = HttpHandlerConfig | HttpServiceConfig;

export interface DeploymentItemsMap {
  [name: string]: DeploymentItemConfig;
}

// artifact related models
export interface Checksum {
  sha256: string;
  md5: string;
}

export interface Artifact {
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
