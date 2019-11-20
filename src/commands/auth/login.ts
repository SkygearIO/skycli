import chalk from "chalk";

import { Arguments, createCommand } from "../../util";
import { requireClusterConfig } from "../middleware";
import { askCredentials } from "./util";
import { cliContainer } from "../../container";

async function run(argv: Arguments) {
  let answers: {
    email: string;
    password: string;
  };
  if (argv["password-stdin"]) {
    const email = argv.email as string;
    if (!email) {
      throw new Error("Please provide --email with --password-stdin");
    }
    let password = await readStdin();
    password = password.replace(/\r\n$|\n$|\r$|\n\r$/g, "");
    answers = {
      email,
      password,
    };
  } else {
    answers = await askCredentials(argv);
  }
  await cliContainer.container.auth.login(answers.email, answers.password);
  console.log(chalk`Login as {green ${answers.email}}.`);
}

async function readStdin(): Promise<string> {
  return new Promise((resolve, reject) => {
    let data = "";
    const stdin = process.stdin;

    stdin.on("data", function(chuck) {
      if (chuck !== null) {
        data += chuck;
      }
    });
    stdin.on("end", function() {
      resolve(data);
    });
    stdin.on("error", (err: Error) => {
      reject(err);
    });
  });
}

export default createCommand({
  builder: yargs => {
    return yargs
      .middleware(requireClusterConfig)
      .option("email", {
        desc: "Login with email",
        type: "string",
      })
      .option("password-stdin", {
        desc: "Provide password from stdin",
        type: "boolean",
      });
  },
  command: "login",
  describe: "Login developer",
  handler: run,
});
