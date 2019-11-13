import chalk from "chalk";

import { Arguments, createCommand } from "../../util";
import { requireClusterConfig } from "../middleware";
import { askCredentials } from "./util";
import { cliContainer } from "../../container";

async function run(argv: Arguments) {
  const answers = await askCredentials(argv);
  await cliContainer.container.auth.login(answers.email, answers.password);
  console.log(chalk`Login as {green ${answers.email}}.`);
}

export default createCommand({
  builder: yargs => {
    return yargs.middleware(requireClusterConfig).option("email", {
      desc: "Login with email",
      type: "string",
    });
  },
  command: "login",
  describe: "Login developer",
  handler: run,
});
