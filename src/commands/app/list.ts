import Table, { HorizontalTable } from 'cli-table3';

import { Arguments, createCommand, displayDate } from '../../util';
import { requireClusterConfig, requireUser } from '../middleware';
import { cliContainer } from '../../container';

async function run(_: Arguments) {
  const apps = await cliContainer.getApps();
  if (apps.length === 0) {
    console.log('No applications');
    return;
  }
  const table = new Table({
    head: ['NAME', 'CREATED_AT']
  }) as HorizontalTable;
  apps.map((a) => {
    table.push([a.name, displayDate(a.created_at)]);
  });
  console.log(table.toString());
}

export default createCommand({
  builder: (yargs) => {
    return yargs.middleware(requireClusterConfig).middleware(requireUser);
  },
  command: 'list',
  describe: 'List applications',
  handler: run
});
