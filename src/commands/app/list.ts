import { Arguments, createCommand, displayDate, createTable } from '../../util';
import { requireClusterConfig, requireUser } from '../middleware';
import { cliContainer } from '../../container';

async function run(_: Arguments) {
  const apps = await cliContainer.getApps();
  if (apps.length === 0) {
    console.log('No apps');
    return;
  }
  const table = createTable({ head: ['NAME', 'CREATED_AT'] });
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
  describe: 'List Skygear apps',
  handler: run
});
