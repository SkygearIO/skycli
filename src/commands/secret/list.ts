import chalk from 'chalk';

import { Arguments, createCommand, displayDate, createTable } from '../../util';
import { requireApp, requireClusterConfig, requireUser } from '../middleware';
import { cliContainer } from '../../container';

async function run(argv: Arguments) {
  const secrets = await cliContainer.getSecrets(argv.context.app || '');
  if (secrets.length === 0) {
    console.log(chalk`No secrets in app {green ${argv.context.app || ''}}`);
    return;
  }

  const table = createTable({ head: ['NAME', 'CREATED_AT'] });
  secrets.map((s) => {
    table.push([s.name, displayDate(s.created_at)]);
  });
  console.log(table.toString());
}

export default createCommand({
  builder: (yargs) => {
    return yargs
      .middleware(requireClusterConfig)
      .middleware(requireUser)
      .middleware(requireApp);
  },
  command: 'list',
  describe: 'List skygear application secret',
  handler: run
});
