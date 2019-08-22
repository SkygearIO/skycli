import { Arguments, createCommand, getCommandGroupHelpMessage } from '../util';
import appCreate from './app/create';
import appDeploy from './app/deploy';
import appScaffold from './app/scaffold';
import viewUserConfig from './app/viewUserConfig';

const subCommands = [appCreate, appScaffold, appDeploy, viewUserConfig];

function run(_argv: Arguments) {
  console.log(getCommandGroupHelpMessage('app', subCommands));
  return Promise.resolve();
}

export default createCommand({
  builder: (yargs) => {
    return subCommands.reduce((y, cmd) => y.command(cmd as any), yargs);
  },
  command: 'app',
  describe: 'Skycli app commands',
  handler: run
});
