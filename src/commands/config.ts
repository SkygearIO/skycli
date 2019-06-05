import { Arguments, createCommand, getCommandGroupHelpMessage } from '../util';
import configSet from './config/setClusterServer';
import configView from './config/view';

const subCommands = [configView, configSet];

function run(_argv: Arguments) {
  console.log(getCommandGroupHelpMessage('config', subCommands));
  return Promise.resolve();
}

export default createCommand({
  builder: (yargs) => {
    return subCommands.reduce((y, cmd) => y.command(cmd as any), yargs);
  },
  command: 'config',
  describe: 'Skycli configuration commands',
  handler: run
});
