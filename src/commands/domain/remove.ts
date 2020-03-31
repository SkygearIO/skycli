import chalk from "chalk";
import inquirer from "inquirer";

import { Arguments, createCommand } from "../../util";
import { requireApp, requireClusterConfig, requireUser } from "../middleware";
import { cliContainer } from "../../container";

function confirm(domain: string) {
  return inquirer.prompt([
    {
      message: `Are you sure to remove domain ${domain}?`,
      name: "proceed",
      type: "confirm",
    },
  ]);
}

async function run(argv: Arguments) {
  const domain = argv.domain as string;
  const answers = await confirm(domain);
  if (!answers.proceed) {
    return;
  }
  const resp = await cliContainer.getDomains(argv.context.app || "");
  const customDomain = resp.custom_domains.find(
    (c) => c.domain === argv.domain
  );
  if (!customDomain) {
    throw new Error("Domain not found.");
  }
  await cliContainer.deleteDomain(argv.context.app || "", customDomain.id);
  console.log(chalk`{green Success!} Removed domain ${customDomain.domain}`);
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
  command: "remove [domain]",
  describe: "Remove domain of app",
  handler: run,
});
