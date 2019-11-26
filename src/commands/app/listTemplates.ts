import { Arguments, createCommand, createTable } from "../../util";
import { requireApp, requireClusterConfig, requireUser } from "../middleware";
import { cliContainer } from "../../container";

async function run(argv: Arguments) {
  const { specs: gearSpecs, items } = await cliContainer.getTemplates(
    argv.context.app || ""
  );
  const table = createTable({ head: ["TYPE", "KEY", "URL"] });

  for (const item of items) {
    table.push([item.type, item.key, item.signed_uri]);
  }

  for (const specs of Object.values(gearSpecs)) {
    for (const spec of specs) {
      if (!items.some(item => item.type === spec.type)) {
        table.push([spec.type, "", "<not provided>"]);
      }
    }
  }

  console.log(table.toString());
}

export default createCommand({
  builder: yargs => {
    return yargs
      .middleware(requireClusterConfig)
      .middleware(requireUser)
      .middleware(requireApp);
  },
  command: "list-templates",
  describe: "List templates",
  handler: run,
});
