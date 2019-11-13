import chalk from "chalk";
import { SkygearErrorNames, SkygearError } from "@skygear/node-client";

export function printError(error: any) {
  let s = "";
  if (error instanceof SkygearError) {
    // TODO(error): Pretty-print SkygearError.
    // For now, we leverage the fact that SkygearError is well-defined JSON and
    // print it directly.
    const errorJSON = {
      name: error.name,
      reason: error.reason,
      message: error.message,
      info: error.info,
    };
    s = JSON.stringify(errorJSON, null, 2);
  } else if (error instanceof Error) {
    s = error.message;
  } else if (typeof error === "object") {
    try {
      s = JSON.stringify(error, null, 2);
    } catch {
      s = `${error}`;
    }
  } else {
    s = `${error}`;
  }

  console.log(chalk.red(s));
}

export function isHTTP404(error: any): boolean {
  return (
    error instanceof SkygearError && error.name === SkygearErrorNames.NotFound
  );
}
