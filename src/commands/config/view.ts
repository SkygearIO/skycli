import * as yaml from "js-yaml";
import { Arguments, createCommand } from "../../util";

function run(argv: Arguments) {
  const configYAML = yaml.safeDump(argv.context.skycliConfig);
  console.log(configYAML);
  return Promise.resolve();
}

export default createCommand({
  command: "view",
  describe: "Show skycli configuration",
  handler: run,
});
