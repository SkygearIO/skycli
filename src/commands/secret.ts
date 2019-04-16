import { Arguments, createCommand, getCommandGroupHelpMessage } from '../util';
import secretList from './secret/list';

const subCommands = [secretList];

function run(argv: Arguments) {
  console.log(getCommandGroupHelpMessage('secret', subCommands));
  return Promise.resolve();
}

export default createCommand({
  builder: (yargs) => {
    return subCommands.reduce((y, cmd) => y.command(cmd), yargs);
  },
  command: 'secret',
  describe: 'Skycli secret management commands',
  handler: run
});
