import Table, { VerticalTable } from "cli-table3";
import { ClusterConfig } from "../../types";
import { Arguments, createCommand } from "../../util";

function createVerticalTableRow(
  key: string,
  value: string
): Table.VerticalTableRow {
  return { [key]: value };
}

function run(argv: Arguments) {
  const cluster = (argv.context.cluster || {}) as ClusterConfig;
  const userContext = argv.context.user;
  const table = new Table({
    head: ["Property", "Value"],
  }) as VerticalTable;

  const userEmail =
    userContext &&
    "loginID" in userContext.identity &&
    userContext.identity.loginID;

  table.push(
    createVerticalTableRow("Cluster Type", cluster.env || ""),
    createVerticalTableRow("Cluster Endpoint", cluster.endpoint),
    createVerticalTableRow("Cluster API Key", cluster.api_key),
    createVerticalTableRow("Account", userEmail || "")
  );

  console.log(table.toString());
  return Promise.resolve();
}

export default createCommand({
  command: "view",
  describe: "Show skycli configuration",
  handler: run,
});
