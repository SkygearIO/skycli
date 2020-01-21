import chalk from "chalk";

import { Arguments, createCommand, createTable } from "../../util";
import { getDomainTableHeader, getDomainTableRow } from "./util";
import { requireApp, requireClusterConfig, requireUser } from "../middleware";
import { cliContainer } from "../../container";

async function run(argv: Arguments) {
  const resp = await cliContainer.getDomains(argv.context.app || "");
  if (resp.custom_domains.length === 0) {
    console.log(chalk`No domains in app {green ${argv.context.app || ""}}`);
    return;
  }

  const table = createTable({
    head: getDomainTableHeader(),
  });

  resp.custom_domains.forEach(c => {
    table.push(getDomainTableRow(c));
  });

  console.log(table.toString() + "\n");
}

export default createCommand({
  builder: yargs => {
    return yargs
      .middleware(requireClusterConfig)
      .middleware(requireUser)
      .middleware(requireApp);
  },
  command: "list",
  describe: "List domains of app",
  handler: run,
});
