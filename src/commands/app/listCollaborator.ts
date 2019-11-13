import { Arguments, createCommand, createTable } from "../../util";
import { requireApp, requireClusterConfig, requireUser } from "../middleware";
import { cliContainer } from "../../container";

async function run(argv: Arguments) {
  const appName = argv.context.app || "";

  const collaborators = await cliContainer.getCollaborators(appName);

  const table = createTable({ head: ["EMAIL"] });
  collaborators.map(c => {
    table.push([c.email]);
  });
  console.log(table.toString());
}

export default createCommand({
  builder: yargs => {
    return yargs
      .middleware(requireClusterConfig)
      .middleware(requireUser)
      .middleware(requireApp);
  },
  command: "list-collaborator",
  describe: "List collaborators",
  handler: run,
});
