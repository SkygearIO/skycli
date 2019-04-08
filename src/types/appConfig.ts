import { CloudCodeConfig } from './cloudCodeConfig';

export interface AppConfig {
  app: string;
  cloudCode: { [name: string]: CloudCodeConfig };
}
