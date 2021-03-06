import { Arguments, createCommand, getCommandGroupHelpMessage } from "../util";
import domainAdd from "./domain/add";
import domainList from "./domain/list";
import domainView from "./domain/view";
import domainVerify from "./domain/verify";
import domainUpdate from "./domain/update";
import domainRemove from "./domain/remove";

const subCommands = [
  domainAdd,
  domainList,
  domainView,
  domainVerify,
  domainUpdate,
  domainRemove,
];

function run(_argv: Arguments) {
  console.log(getCommandGroupHelpMessage("domain", subCommands));
  return Promise.resolve();
}

export default createCommand({
  builder: (yargs) => {
    return subCommands.reduce((y, cmd) => y.command(cmd as any), yargs);
  },
  command: "domain",
  describe: "Skycli custom domain management commands",
  handler: run,
});
