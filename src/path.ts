import envPath from 'env-paths';
import { join } from 'path';

const skycliPaths = envPath('skycli', { suffix: '' });

export function configPath(...relPaths: string[]): string {
  return join(skycliPaths.config, ...relPaths);
}

export function dataPath(...relPaths: string[]): string {
  return join(skycliPaths.data, ...relPaths);
}

export function tempPath(...relPaths: string[]): string {
  return join(skycliPaths.temp, ...relPaths);
}
