import fs from "fs-extra";
import { mkdir as mkdirCB } from "fs";
import { promisify } from "util";

import inquirer from "inquirer";
import fetch from "node-fetch";

import { Arguments, createCommand } from "../../util";
import { requireApp, requireClusterConfig, requireUser } from "../middleware";
import { cliContainer } from "../../container";
import {
  templateItemToLocalTemplatePath,
  printTemplateItems,
} from "./templateHelper";

const mkdir = promisify(mkdirCB);

async function run(argv: Arguments) {
  const templateDir = argv.dir as string;
  const remoteTemplates = await cliContainer.getTemplates(
    argv.context.app || ""
  );

  const overwrites = [];
  for (const i of remoteTemplates) {
    const p = templateItemToLocalTemplatePath(i, templateDir);
    try {
      await fs.access(p);
      overwrites.push(i);
    } catch (e) {}
  }

  if (overwrites.length > 0) {
    printTemplateItems(
      overwrites,
      "The following templates will be overwritten:",
      templateDir
    );
    if (!argv.yes) {
      const answers = await inquirer.prompt([
        {
          message: "Continue?",
          name: "confirm",
          type: "confirm",
        },
      ]);
      if (!answers.confirm) {
        return;
      }
    }
  }

  await mkdir(templateDir, { recursive: true });

  for (const i of remoteTemplates) {
    const p = templateItemToLocalTemplatePath(i, templateDir);
    const resp = await fetch(i.url);
    const buf = await resp.buffer();
    await fs.writeFile(p, buf);
    console.log(`Downloaded template to ${p}`);
  }
}

export default createCommand({
  builder: yargs => {
    return yargs
      .middleware(requireClusterConfig)
      .middleware(requireUser)
      .middleware(requireApp)
      .option("yes", {
        alias: "y",
        type: "boolean",
        description: "Skip confirmation",
      })
      .option("dir", {
        alias: "d",
        type: "string",
        description: "The templates directory",
        default: "templates",
      });
  },
  command: "download-templates",
  describe: "Download templates",
  handler: run,
});
