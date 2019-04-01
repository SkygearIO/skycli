import { Arguments, createCommand, getCommandGroupHelpMessage } from '../util';
import userLogin from './user/login';
import userLogout from './user/logout';
import userSignup from './user/signup';

const subCommands = [userSignup, userLogin, userLogout];

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
