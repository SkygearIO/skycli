import chalk from "chalk";
import { Arguments } from "../../util";
import commandExists from "command-exists";

function requireProgram(program: string): (argv: Arguments) => Promise<void> {
  return function(_argv: Arguments): Promise<void> {
    return new Promise((resolve, reject) => {
      commandExists(program, (err, exists) => {
        if (err) {
          reject(err);
        } else if (!exists) {
          reject(chalk`{red ERROR:} command ${program} not found`);
        } else {
          resolve();
        }
      });
    });
  };
}

export default requireProgram;
