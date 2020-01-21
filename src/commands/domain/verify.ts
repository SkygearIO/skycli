import chalk from "chalk";
import { Arguments, createCommand } from "../../util";
import { requireApp, requireClusterConfig, requireUser } from "../middleware";
import { cliContainer } from "../../container";

async function run(argv: Arguments) {
  const resp = await cliContainer.getDomains(argv.context.app || "");

  const customDomain = resp.custom_domains.find(c => c.domain === argv.domain);
  if (!customDomain) {
    throw new Error("Domain not found.");
  }
  if (customDomain.verified) {
    throw new Error("Domain is verified already.");
  }

  await cliContainer.verifyDomain(argv.context.app || "", customDomain.id);

  console.log(
    chalk`{green Success!} You can now access your app through ${customDomain.domain}.`
  );
  console.log(
    `Your site may show a security certificate warning until the certificate has been provisioned. \n`
  );
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
  command: "verify [domain]",
  describe: "Verify domain of app",
  handler: run,
});
