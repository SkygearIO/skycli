import { Arguments, createCommand, createTable } from "../../util";
import { requireApp, requireClusterConfig, requireUser } from "../middleware";
import { cliContainer } from "../../container";

async function run(argv: Arguments) {
  const templates = await cliContainer.getTemplates(argv.context.app || "");
  const table = createTable({ head: ["TYPE", "KEY", "URL"] });
  for (const t of templates) {
    table.push([t.type, t.key, t.url]);
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
