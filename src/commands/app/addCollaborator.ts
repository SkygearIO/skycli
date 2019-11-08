import chalk from "chalk";

import { Arguments, createCommand } from "../../util";
import { requireApp, requireClusterConfig, requireUser } from "../middleware";
import { cliContainer } from "../../container";

async function run(argv: Arguments) {
  const appName = argv.context.app || "";
  const email = argv.email as string;

  if (!email) {
    throw new Error("Email is required.");
  }

  const invited = await cliContainer.addCollaborator(appName, email);
  if (invited) {
    console.log(chalk`{green Success!} Invitation sent.`);
  } else {
    console.log(chalk`{green Success!} Added developer as collaborator.`);
  }
}

export default createCommand({
  builder: yargs => {
    return yargs
      .middleware(requireClusterConfig)
      .middleware(requireUser)
      .middleware(requireApp)
      .demandOption(["email"])
      .option("email", {
        type: "string",
        describe: `Developer's email`,
      });
  },
  command: "add-collaborator [email]",
  describe: "Add developer as collaborator by email",
  handler: run,
});
