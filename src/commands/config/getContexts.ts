import { Arguments, createCommand, createTable } from "../../util";

function run(argv: Arguments) {
  const config = argv.context.skycliConfig;
  const currentContext = argv.context.currentContext;
  const contexts = config?.contexts ?? [];
  const table = createTable({
    head: ["CURRENT", "CLUSTER", "USER"],
  });

  for (const { name, context } of contexts) {
    const userConfig = config?.users?.find(u => u.name === context.user);
    table.push([
      name === currentContext ? "*" : " ",
      context.cluster,
      userConfig ? (userConfig.user.identity as any).login_id : "",
    ]);
  }

  console.log(table.toString() + "\n");

  return Promise.resolve();
}

export default createCommand({
  command: "get-contexts",
  describe: "Get context list",
  handler: run,
});
