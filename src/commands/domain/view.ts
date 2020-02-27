import { Arguments, createCommand, createTable } from "../../util";
import {
  tableIndentationPadding,
  getDomainTableHeader,
  getDomainTableRow,
  getDNSRecordTableHeader,
  getDNSRecordTableRow,
} from "./util";
import { requireApp, requireClusterConfig, requireUser } from "../middleware";
import { cliContainer } from "../../container";

async function run(argv: Arguments) {
  const resp = await cliContainer.getDomains(argv.context.app || "");

  const customDomain = resp.custom_domains.find(c => c.domain === argv.domain);
  if (!customDomain) {
    throw new Error("Domain not found.");
  }

  const rootDomain = resp.root_domains.find(
    r => r.id === customDomain?.root_domain_id
  );
  if (!rootDomain) {
    throw new Error("Root domain not found.");
  }

  console.log("General \n");

  const table = createTable({
    head: getDomainTableHeader(),
    style: {
      "padding-left": tableIndentationPadding,
      "padding-right": 2,
      head: [],
    },
  });

  table.push(getDomainTableRow(customDomain));

  console.log(table.toString() + "\n");

  const dnsRecordsTable = createTable({
    head: getDNSRecordTableHeader(),
    style: {
      "padding-left": tableIndentationPadding,
      "padding-right": 2,
      head: [],
    },
  });

  rootDomain.dns_records.forEach(dns => {
    dnsRecordsTable.push(getDNSRecordTableRow(dns));
  });

  customDomain.dns_records.forEach(dns => {
    dnsRecordsTable.push(getDNSRecordTableRow(dns));
  });

  const hasRows = dnsRecordsTable.length > 0;
  if (hasRows) {
    console.log("DNS records \n");
    console.log(dnsRecordsTable.toString() + "\n");
  }
}

export default createCommand({
  builder: yargs => {
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
  command: "view [domain]",
  describe: "View domain of app",
  handler: run,
});
