import chalk from 'chalk';
import { MiddlewareFunction } from 'yargs';
import { Arguments } from '../../util';

function requireClusterConfig(argv: Arguments): Promise<void> {
  if (argv.context.cluster && argv.context.cluster.endpoint) {
    return Promise.resolve();
  }

  return Promise.reject(chalk`{red ERROR:} Missing cluster server endpoint.
To setup, please run:
    skycli config set-cluster-server`);
}

export default (requireClusterConfig as any) as MiddlewareFunction;
