import { Arguments, createCommand, getCommandGroupHelpMessage } from '../util';
import userSignup from './user/signup';

const subCommands = [userSignup];

function run(argv: Arguments) {
  console.log(getCommandGroupHelpMessage('user', subCommands));
  return Promise.resolve();
}

export default createCommand({
  builder: (yargs) => {
    return subCommands.reduce((y, cmd) => y.command(cmd), yargs);
  },
  command: 'user',
  describe: 'Skycli user commands',
  handler: run
});
