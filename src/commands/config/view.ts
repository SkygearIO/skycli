import Table, { VerticalTable } from 'cli-table3';
import { ClusterConfig, User } from '../../types';
import { Arguments, createCommand } from '../../util';

function createVerticalTableRow(
  key: string,
  value: string
): Table.VerticalTableRow {
  return { [key]: value };
}

function run(argv: Arguments) {
  const cluster = (argv.context.cluster || {}) as ClusterConfig;
  const user = (argv.context.user || {}) as User;
  const table = new Table({
    head: ['Property', 'Value']
  }) as VerticalTable;

  table.push(
    createVerticalTableRow('Cluster Type', cluster.env || ''),
    createVerticalTableRow('Cluster Endpoint', cluster.endpoint),
    createVerticalTableRow('Cluster API Key', cluster.apiKey),
    createVerticalTableRow('Account', user && user.email)
  );

  console.log(table.toString());
  return Promise.resolve();
}

export default createCommand({
  command: 'view',
  describe: 'Show skycli configuration',
  handler: run
});
