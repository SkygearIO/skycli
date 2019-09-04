import { Arguments, createCommand, getCommandGroupHelpMessage } from '../util';
import appCreate from './app/create';
import appList from './app/list';
import appDeploy from './app/deploy';
import appScaffold from './app/scaffold';
import viewUserConfig from './app/viewUserConfig';
import updateUserConfig from './app/updateUserConfig';
import addCollaborator from './app/addCollaborator';

const subCommands = [
  appCreate,
  appList,
  appScaffold,
  appDeploy,
  viewUserConfig,
  updateUserConfig,
  addCollaborator
];

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
