import { Arguments, createCommand, getCommandGroupHelpMessage } from "../util";
import authLogin from "./auth/login";
import authLogout from "./auth/logout";
import authSignup from "./auth/signup";

const subCommands = [authLogin, authLogout, authSignup];

function run(_argv: Arguments) {
  console.log(getCommandGroupHelpMessage("auth", subCommands));
  return Promise.resolve();
}

export default createCommand({
  builder: (yargs) => {
    return subCommands.reduce((y, cmd) => y.command(cmd as any), yargs);
  },
  command: "auth",
  describe: "Skycli auth commands",
  handler: run,
});
