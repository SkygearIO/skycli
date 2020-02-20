import { Arguments, createCommand, createTable } from "../../util";

function run(argv: Arguments) {
  const currentCluster = argv.context.context?.cluster;
  const clusters = argv.context.skycliConfig?.clusters ?? [];
  const table = createTable({
    head: ["CURRENT", "NAME"],
  });

  for (const cluster of clusters) {
    table.push([cluster.name === currentCluster ? "*" : " ", cluster.name]);
  }

  console.log(table.toString() + "\n");

  return Promise.resolve();
}

export default createCommand({
  command: "list-clusters",
  describe: "List configured clusters",
  handler: run,
});
