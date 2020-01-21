import chalk from "chalk";

import { Arguments, createCommand } from "../../util";
import { MiddlewareFunction } from "yargs";
import { requireApp, requireClusterConfig, requireUser } from "../middleware";
import { cliContainer } from "../../container";

async function run(argv: Arguments) {
  const secretName = argv.name as string;
  const secretType = argv.type as string;
  await cliContainer.createSecret(
    argv.context.app || "",
    secretName,
    secretType,
    argv.encodedValue as string | undefined,
    argv.encodedCert as string | undefined,
    argv.encodedKey as string | undefined
  );
  console.log(chalk`{green Success!} Created secret ${secretName}`);
}

const parseSecretValue = function(
  argv: Arguments
): Promise<{ [key: string]: string }> {
  let crt = 0;
  if (argv.value) {
    crt++;
  }

  if (argv.file) {
    crt++;
  }
  if (crt === 0) {
    return Promise.reject(
      chalk`{red ERROR:} Missing required arguments: value or file`
    );
  }
  if (crt > 1) {
    return Promise.reject(
      chalk`{red ERROR:} Only either value or file is allowed`
    );
  }

  const secretValue = (argv.value || argv.file) as string;
  const encodedValue = Buffer.from(secretValue).toString("base64");
  return Promise.resolve({ encodedValue });
};

const parseSecretTLS = function(
  argv: Arguments
): Promise<{ [key: string]: string }> {
  if (!argv.cert || !argv.key) {
    return Promise.reject(
      chalk`{red ERROR:} Cert and key are required for TLS secret`
    );
  }

  const encodedCert = Buffer.from(argv.cert as string).toString("base64");
  const encodedKey = Buffer.from(argv.key as string).toString("base64");
  return Promise.resolve({ encodedCert, encodedKey });
};

const parseSecretValues = (function(argv: Arguments): Promise<any> {
  if (argv.type === "tls") {
    return parseSecretTLS(argv);
  }
  return parseSecretValue(argv);
} as any) as MiddlewareFunction;

export default createCommand({
  builder: yargs => {
    return yargs
      .middleware(requireClusterConfig)
      .middleware(requireUser)
      .middleware(requireApp)
      .middleware(parseSecretValues)
      .demandOption(["name"])
      .option("name", {
        desc:
          "Secret name. Only letters, numbers, underscore, hyphen and dot are allowed",
        type: "string",
      })
      .option("value", {
        desc: "Secret value",
        type: "string",
      })
      .option("type", {
        desc: "Secret type",
        type: "string",
        default: "opaque",
        choices: ["opaque", "dockerconfigjson", "tls"],
      })
      .option("file", {
        alias: "f",
        desc: "Secret value from file",
        type: "string",
      })
      .coerce("file", function(arg) {
        return require("fs").readFileSync(arg, "utf8");
      })
      .option("cert", {
        desc: "PEM encoded public key certificate file",
        type: "string",
      })
      .coerce("cert", function(arg) {
        return require("fs").readFileSync(arg, "utf8");
      })
      .option("key", {
        desc: "PEM encoded private key file associated with given certificate",
        type: "string",
      })
      .coerce("key", function(arg) {
        return require("fs").readFileSync(arg, "utf8");
      });
  },
  command: "create [name] [value]",
  describe: "Create app secret",
  handler: run,
});
