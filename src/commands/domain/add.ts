import chalk from "chalk";
import punycode from "punycode";

import { Arguments, createCommand, createTable } from "../../util";
import { getDNSRecordTableHeader, getDNSRecordTableRow } from "./util";
import { requireApp, requireClusterConfig, requireUser } from "../middleware";
import { cliContainer } from "../../container";

async function run(argv: Arguments) {
  const encodedDomain = punycode.toASCII(argv.domain as string);
  const resp = await cliContainer.addDomain(
    argv.context.app || "",
    encodedDomain
  );

  const customDomain = resp.custom_domain;
  const rootDomain = resp.root_domain;

  console.log(
    chalk`{green Success!} Added domain ${customDomain.domain} successfully!`
  );

  console.log(`Add following DNS records in your DNS provider.\n`);
  const table = createTable({ head: getDNSRecordTableHeader() });
  rootDomain.dns_records.forEach((dns) => {
    table.push(getDNSRecordTableRow(dns));
  });
  customDomain.dns_records.forEach((dns) => {
    table.push(getDNSRecordTableRow(dns));
  });

  console.log(table.toString() + "\n");
  console.log(
    `After updating DNS records, run \`skycli domain verify ${customDomain.domain}\` to verify domain.`
  );
}

export default createCommand({
  builder: (yargs) => {
    return yargs
      .middleware(requireClusterConfig)
      .middleware(requireUser)
      .middleware(requireApp)
      .demandOption(["domain"])
      .option("domain", {
        type: "string",
        describe: "Domain name",
      });
  },
  command: "add [domain]",
  describe: "Add new domain to app",
  handler: run,
});
