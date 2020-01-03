/**
 * Copyright 2017 Oursky Ltd.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */
import { loadConfig } from "./config";
import { currentCLIContext } from "./configUtil";
import { Arguments } from "./util";
import commands from "./commands";
import yargs from "yargs";

function checkArguments(argv: Arguments) {
  // Populate some data from argv for convenience
  argv.context = currentCLIContext(argv, loadConfig());

  // Print argv for debug mode to facilitate debugging.
  if (argv.debug) {
    console.log("argv: ", argv);
  }
  return true;
}

let cli = yargs.strict();
for (const c of commands) {
  cli = cli.command(c as any);
}
cli = cli
  .demandCommand()
  .pkgConf("skycli", __dirname)
  .env("SKYCLI")
  .option("debug", {
    type: "boolean",
    desc: "Show debug logs",
  })
  .option("verbose", {
    type: "boolean",
    desc: "Show verbose logs",
  })
  .option("app", {
    type: "string",
    desc: "Specify the App name",
  })
  .option("context", {
    hidden: true,
    skipValidation: true,
  })
  .check(checkArguments as any)
  .help();

export default cli;
