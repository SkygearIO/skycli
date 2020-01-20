import { Arguments, createCommand } from "../../util";
import { requireClusterConfig, requireUser, requireApp } from "../middleware";
import { cliContainer } from "../../container";

async function run(argv: Arguments) {
  const appName = argv.context.app ?? "";
  const {
    token_request: { status },
  } = await cliContainer.getTokenRequest(appName);
  const execCredential = {
    apiVersion: "client.authentication.k8s.io/v1beta1",
    kind: "ExecCredential",
    status,
  };
  console.log(JSON.stringify(execCredential));
}

export default createCommand({
  builder: yargs => {
    return yargs
      .middleware(requireClusterConfig)
      .middleware(requireUser)
      .middleware(requireApp);
  },
  command: "get-k8s-token-request",
  describe: "Output ExecCredential",
  handler: run,
});
