import { Arguments, createCommand, getCommandGroupHelpMessage } from '../util';
import configSet from './config/setClusterServer';
import configView from './config/view';

const subCommands = [configView, configSet];

function run(argv: Arguments) {
  console.log(getCommandGroupHelpMessage('config', subCommands));
  return Promise.resolve();
}

export default createCommand({
  builder: (yargs) => {
    return subCommands.reduce((y, cmd) => y.command(cmd), yargs);
  },
  command: 'config',
  describe: 'Skycli configuration commands',
  handler: run
});
