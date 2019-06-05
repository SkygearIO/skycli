import chalk from 'chalk';
import Table, { HorizontalTable } from 'cli-table3';

import { controller } from '../../api';
import { Secret } from '../../types';
import { Arguments, createCommand, displayDate } from '../../util';
import { requireApp, requireClusterConfig, requireUser } from '../middleware';

function run(argv: Arguments) {
  return controller
    .getSecrets(argv.context)
    .then((secrets: Secret[]) => {
      if (secrets.length === 0) {
        console.log(chalk`No secrets in app {green ${argv.context.app || ''}}`);
        return Promise.resolve();
      }
      const table = new Table({
        head: ['NAME', 'CREATED_AT']
      }) as HorizontalTable;
      secrets.map((s: Secret) => {
        table.push([s.name, displayDate(s.createdAt)]);
      });
      console.log(table.toString());
      return Promise.resolve();
    })
    .catch((error) => {
      return Promise.reject('Fail to fetch secrets. ' + error);
    });
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
