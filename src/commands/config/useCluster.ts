import chalk from "chalk";
import { Arguments, createCommand } from "../../util";
import { save } from "../../config";

function run(argv: Arguments) {
  const config = argv.context.skycliConfig;
  const contexts = config?.contexts ?? [];
  const clusterContext = contexts.find(
    ctx => ctx.context.cluster === argv.name
  );
  if (!config || !clusterContext) {
    throw new Error(
      `Cluster not configured. Use list-clusters command to list valid clusters.`
    );
  }

  config.current_context = clusterContext.name;
  save(config, "global");

  console.log(chalk`Current cluster set to {green ${clusterContext.name}}.`);

  return Promise.resolve();
}

export default createCommand({
  builder: yargs => {
    return yargs.demandOption(["name"]).option("name", {
      type: "string",
      describe: "Cluster name",
    });
  },
  command: "use-cluster [name]",
  describe: "Set current cluster",
  handler: run,
});
