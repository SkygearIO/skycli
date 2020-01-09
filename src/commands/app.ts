import { Arguments, createCommand, getCommandGroupHelpMessage } from "../util";
import appCreate from "./app/create";
import appList from "./app/list";
import appDeploy from "./app/deploy";
import appScaffold from "./app/scaffold";
import viewConfig from "./app/viewConfig";
import updateConfig from "./app/updateConfig";
import addCollaborator from "./app/addCollaborator";
import listCollaborator from "./app/listCollaborator";
import removeCollaboartor from "./app/removeCollaboartor";
import listTemplates from "./app/listTemplates";
import updateTemplates from "./app/updateTemplates";
import downloadTemplates from "./app/downloadTemplates";

const subCommands = [
  appCreate,
  appList,
  appScaffold,
  appDeploy,
  viewConfig,
  updateConfig,
  addCollaborator,
  removeCollaboartor,
  listCollaborator,
  listTemplates,
  updateTemplates,
  downloadTemplates,
];

function run(_argv: Arguments) {
  console.log(getCommandGroupHelpMessage("app", subCommands));
  return Promise.resolve();
}

export default createCommand({
  builder: yargs => {
    return subCommands.reduce((y, cmd) => y.command(cmd as any), yargs);
  },
  command: "app",
  describe: "Skycli app commands",
  handler: run,
});
