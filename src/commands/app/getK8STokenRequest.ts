import { Arguments, createCommand } from "../../util";
import { requireClusterConfig, requireUser, requireApp } from "../middleware";
import { cliContainer } from "../../container";
import { cacheString } from "../../cache";

async function run(argv: Arguments) {
  // TODO(get-k8s-credentials): Support --context
  const cacheKey = `ExecCredential_${argv.context.skycliConfig
    ?.current_context ?? ""}`;

  const content = await cacheString({
    cacheKey,
    create: async () => {
      const appName = argv.context.app ?? "";
      const {
        token_request: { status },
      } = await cliContainer.getTokenRequest(appName);
      const execCredential = {
        apiVersion: "client.authentication.k8s.io/v1beta1",
        kind: "ExecCredential",
        status: {
          // Ideally we should include expirationTimestamp
          // but it seems that including it will make
          // kubectl keeps emitting 401 error.
          token: status.token,
        },
      };
      return JSON.stringify(execCredential);
    },
    validate: async (_content: string) => {
      // We do not include expirationTimestamp now
      // So there is no way to validate the cache.
      throw new Error();
      // const execCredential = JSON.parse(content);
      // const now = new Date();
      // const date = new Date(execCredential.status.expirationTimestamp);
      // if (isNaN(date.getTime())) {
      //   throw new Error();
      // }
      // if (date <= now) {
      //   throw new Error();
      // }
    },
  });
  console.log(content);
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
