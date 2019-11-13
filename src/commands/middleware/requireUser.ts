import chalk from "chalk";
import { MiddlewareFunction } from "yargs";
import { Arguments } from "../../util";

function requireUser(argv: Arguments): Promise<void> {
  if (argv.context.user && argv.context.user.access_token) {
    return Promise.resolve();
  }

  return Promise.reject(chalk`{red ERROR:} Requires authentication, please login.
To login, please run:
    skycli auth login`);
}

export default (requireUser as any) as MiddlewareFunction;
