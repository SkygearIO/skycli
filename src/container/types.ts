export interface App {
  id: string;
  name: string;
  created_at: Date;
  updated_at: Date;
}

export interface Secret {
  name: string;
  created_at: Date;
  updated_at: Date;
}

export interface UserConfiguration {
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
