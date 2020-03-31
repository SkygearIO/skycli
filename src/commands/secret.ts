import { Arguments, createCommand, getCommandGroupHelpMessage } from "../util";
import secretCreate from "./secret/create";
import secretDelete from "./secret/delete";
import secretList from "./secret/list";

const subCommands = [secretList, secretCreate, secretDelete];

function run(_argv: Arguments) {
  console.log(getCommandGroupHelpMessage("secret", subCommands));
  return Promise.resolve();
}

export default createCommand({
  builder: (yargs) => {
    return subCommands.reduce((y, cmd) => y.command(cmd as any), yargs);
  },
  command: "secret",
  describe: "Skycli secret management commands",
  handler: run,
});
