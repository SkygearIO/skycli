import { Arguments, createCommand, getCommandGroupHelpMessage } from "../util";
import domainAdd from "./domain/add";

const subCommands = [domainAdd];

function run(_argv: Arguments) {
  console.log(getCommandGroupHelpMessage("domain", subCommands));
  return Promise.resolve();
}

export default createCommand({
  builder: yargs => {
    return subCommands.reduce((y, cmd) => y.command(cmd as any), yargs);
  },
  command: "domain",
  describe: "Skycli custom domain management commands",
  handler: run,
});