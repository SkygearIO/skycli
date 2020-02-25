import chalk from "chalk";
import { Arguments, createCommand } from "../../util";
import { save } from "../../config";

function run(argv: Arguments) {
  const config = argv.context.skycliConfig;
  const contexts = config?.contexts ?? [];
  const context = contexts.find(ctx => ctx.name === argv.name);
  if (!config || !context) {
    throw new Error(
      `Context ${argv.name} does not exist. Use get-contexts to list available contexts.`
    );
  }

  config.current_context = context.name;
  save(config, "global");

  console.log(chalk`Current context set to {green ${context.name}}.`);

  return Promise.resolve();
}

export default createCommand({
  builder: yargs => {
    return yargs.demandOption(["name"]).option("name", {
      type: "string",
      describe: "Context name",
    });
  },
  command: "use-context [name]",
  describe: "Set current context",
  handler: run,
});
