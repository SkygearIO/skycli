import chalk from "chalk";
import { Arguments, createCommand } from "../../util";
import { requireApp, requireClusterConfig, requireUser } from "../middleware";
import { cliContainer } from "../../container";
import { MiddlewareFunction } from "yargs";

async function run(argv: Arguments) {
  const resp = await cliContainer.getDomains(argv.context.app || "");

  const customDomain = resp.custom_domains.find(c => c.domain === argv.domain);
  if (!customDomain) {
    throw new Error("Domain not found.");
  }
  if (!customDomain.verified) {
    throw new Error("Domain is not verified.");
  }

  let redirectDomain: string | undefined;
  if (argv["disable-redirect"]) {
    redirectDomain = "";
  } else if (argv["redirect-domain"]) {
    redirectDomain = argv["redirect-domain"] as string;
  }

  let tlsSecretName: string | undefined;
  if (argv["use-letsencrypt"]) {
    tlsSecretName = "";
  } else if (argv["tls-secret"]) {
    tlsSecretName = argv["tls-secret"] as string;
  }

  await cliContainer.updateDomain(
    argv.context.app || "",
    customDomain.id,
    redirectDomain,
    tlsSecretName
  );

  console.log(chalk`{green Success!} Updated domain ${customDomain.domain}.`);
}

const validateDomainUpdate = (function(argv: Arguments): Promise<any> {
  if (argv["disable-redirect"] && argv["redirect-domain"]) {
    return Promise.reject(
      chalk`{red ERROR:} You can provider either {bold --disable-redirect} or {bold --redirect-domain=[REDIRECT_DOMAIN]}`
    );
  }
  if (argv["use-letsencrypt"] && argv["tls-secret"]) {
    return Promise.reject(
      chalk`{red ERROR:} You can provider either {bold --disable-redirect} or {bold --tls-secret=[TLS_SECRET_NAME]}`
    );
  }

  return Promise.resolve();
} as any) as MiddlewareFunction;

export default createCommand({
  builder: yargs => {
    return yargs
      .middleware(requireClusterConfig)
      .middleware(requireUser)
      .middleware(requireApp)
      .middleware(validateDomainUpdate)
      .demandOption(["domain"])
      .option("domain", {
        type: "string",
        describe: "Domain name",
      })
      .option("tls-secret", {
        type: "string",
        describe: "Custom certificate secret name",
      })
      .option("use-letsencrypt", {
        type: "boolean",
        describe: "Configure using let's encrypt certs for the given domain",
      })
      .option("disable-redirect", {
        type: "boolean",
        describe: "Disable domain redirect.",
      })
      .option("redirect-domain", {
        type: "string",
        describe:
          "Configure domain redirect, provide domain name that you want to redirect to",
      });
  },
  command: "update [domain]",
  describe: "Update domain of app",
  handler: run,
});
