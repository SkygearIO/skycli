import { Arguments, createCommand, getCommandGroupHelpMessage } from '../util';
import secretCreate from './secret/create';
import secretDelete from './secret/delete';
import secretList from './secret/list';
import secretRename from './secret/rename';

const subCommands = [secretList, secretCreate, secretRename, secretDelete];

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
