import chalk from "chalk";
import { Arguments, createCommand } from "../../util";
import { requireApp, requireClusterConfig, requireUser } from "../middleware";
import { cliContainer } from "../../container";
import { SkygearError } from "@skygear/node-client";

async function run(argv: Arguments) {
  const resp = await cliContainer.getDomains(argv.context.app || "");

  const customDomain = resp.custom_domains.find(
    (c) => c.domain === argv.domain
  );
  if (!customDomain) {
    throw new Error("Domain not found.");
  }

  let missingRecords: any[] = [];
  try {
    await cliContainer.verifyDomain(argv.context.app || "", customDomain.id);
  } catch (err) {
    if (err instanceof SkygearError && err.reason === "MissingDNSRecord") {
      missingRecords = (err.info as any)?.causes.map((c: any) => c.record);
    } else {
      throw err;
    }
  }

  console.log(
    chalk`{green Success!} You can now access your app through ${customDomain.domain}.`
  );
  if (missingRecords.length > 0) {
    console.log(
      chalk`{yellow WARN:} Some provided DNS records is not found. You may want to check DNS configuration again:
${missingRecords.map((r) => JSON.stringify(r, null, 4)).join("\n")}`
    );
  }
  console.log(
    `Your site may show a security certificate warning until the certificate has been provisioned. \n`
  );
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
  command: "verify [domain]",
  describe: "Verify domain of app",
  handler: run,
});
