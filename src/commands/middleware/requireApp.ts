import chalk from "chalk";
import { MiddlewareFunction } from "yargs";
import { Arguments } from "../../util";

function requireApp(argv: Arguments): Promise<void> {
  if (argv.context.app) {
    return Promise.resolve();
  }

  return Promise.reject(chalk`{red ERROR:} Requires skygear.yaml, please setup app directory.
To setup, please run:
    skycli app scaffold`);
}

export default (requireApp as any) as MiddlewareFunction;
