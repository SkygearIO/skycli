import { Arguments, createCommand, getCommandGroupHelpMessage } from '../util';
import appCreate from './app/create';
import appScaffold from './app/scaffold';

const subCommands = [appCreate, appScaffold];

function run(argv: Arguments) {
  console.log(getCommandGroupHelpMessage('app', subCommands));
  return Promise.resolve();
}

export default createCommand({
  builder: (yargs) => {
    return subCommands.reduce((y, cmd) => y.command(cmd), yargs);
  },
  command: 'app',
  describe: 'Skycli app commands',
  handler: run
});
