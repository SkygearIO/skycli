import chalk from "chalk";

import { Arguments, createCommand } from "../../util";
import { requireClusterConfig } from "../middleware";
import { askCredentials } from "./util";
import { cliContainer } from "../../container";

async function run(argv: Arguments) {
  const answers = await askCredentials(argv);

  await cliContainer.container.auth.signup(
    { email: answers.email },
    answers.password
  );
  console.log(
    chalk`Sign up as {green ${answers.email}}. To use the account, please check your email inbox and click the link in the email to complete verification.`
  );
}

export default createCommand({
  builder: (yargs) => {
    return yargs.middleware(requireClusterConfig).option("email", {
      desc: "Sign up with email",
      type: "string",
    });
  },
  command: "signup",
  describe: "Sign up developer",
  handler: run,
});
