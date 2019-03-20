import chalk from 'chalk';
import { Arguments } from '../../util';

export default function requireClusterConfig(argv: Arguments) {
    if (argv.context.cluster && argv.context.cluster.endpoint) {
        return;
    }

    return Promise.reject(chalk`{red ERROR:} Missing cluster server endpoint.
To setup, please run:
    skycli config set-cluster-server`);
}