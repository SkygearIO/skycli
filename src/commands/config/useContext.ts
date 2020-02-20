import chalk from "chalk";
import { Arguments, createCommand } from "../../util";
import { save } from "../../config";

function run(argv: Arguments) {
  const config = argv.context.skycliConfig;
  const contexts = config?.contexts ?? [];
  const context = contexts.find(ctx => ctx.name === argv.name);
  if (!config || !context) {
    throw new Error(
      `Context not configured. Use get-contexts command to list valid contexts.`
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
