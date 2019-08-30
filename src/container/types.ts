export interface App {
  id: string;
  name: string;
  last_deployment_id?: string;
  created_at: Date;
  updated_at: Date;
}

export type Endpoint = string;

export interface Secret {
  name: string;
  created_at: Date;
  updated_at: Date;
}

export interface UserConfiguration {
  api_key?: string;
  master_key?: string;
  welcome_email?: WelcomeEmailConfiguration;
  forgot_password?: ForgotPasswordConfiguration;
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
  type: 'http-handler';
  path: string;
  runtime_environment: string;
  entry: string;
  src: string;
  secrets: string[];
}

export interface HttpServiceConfig {
  type: 'http-service';
  path: string;
  port: number;
  context: string;
  dockerfile?: string;
  secrets: string[];
  environment: { [name: string]: string };
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

export interface PresignedRequest {
  method: string;
  url: string;
  fields: { [name: string]: string };
  headers: string[];
}

export interface CreateArtifactUploadResponse {
  uploadRequest: PresignedRequest;
  artifactRequest: string;
}

export interface LogEntry {
  level: string;
  message: string;
  timestamp: Date;
}

export enum DeploymentStatus {
  Pending = 'Pending',
  Running = 'Running',
  DeployFailed = 'DeployFailed',
  Stopping = 'Stopping',
  StopFailed = 'StopFailed',
  Stopped = 'Stopped'
}
export interface Deployment {
  id: string;
  status: DeploymentStatus;
}
