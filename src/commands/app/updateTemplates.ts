import { join, relative, sep } from "path";

import inquirer from "inquirer";
import fs from "fs-extra";

import { Arguments, createCommand } from "../../util";
import { requireApp, requireClusterConfig, requireUser } from "../middleware";
import { cliContainer } from "../../container";
import {
  TemplateItem,
  LocalTemplateItem,
  RemoteTemplateItem,
} from "../../container/types";
import { contentMD5OfFilePath } from "../../contentmd5";
import { findEqualReference, printTemplateItems } from "./templateHelper";

async function collectTemplatePaths(
  filePath: string,
  output: string[],
  depth: number
): Promise<void> {
  if (depth < 0) {
    return;
  }

  const stats = await fs.lstat(filePath);
  if (stats.isDirectory()) {
    const basenames = await fs.readdir(filePath);
    const filePaths = basenames.map(basename => join(filePath, basename));
    for (const p of filePaths) {
      await collectTemplatePaths(p, output, depth - 1);
    }
  } else if (stats.isFile() || stats.isSymbolicLink()) {
    output.push(filePath);
  }
}

async function localTemplatePathToLocalTemplateItem(
  templatePath: string,
  templateDir: string
): Promise<LocalTemplateItem> {
  // TODO(template): we do not support language tag nor key validation now.
  let type = "";
  let key;
  const keyType = relative(templateDir, templatePath).split(sep);
  switch (keyType.length) {
    case 1:
      type = keyType[0];
      break;
    case 2:
      key = keyType[0];
      type = keyType[1];
      break;
    default:
      throw new Error("unexpected template: " + keyType);
  }

  const content_md5 = await contentMD5OfFilePath(templatePath);

  return {
    type,
    key,
    content_md5,
    filePath: templatePath,
  };
}

export interface DiffResult {
  added: LocalTemplateItem[];
  removed: RemoteTemplateItem[];
  updated: LocalTemplateItem[];
  unchanged: RemoteTemplateItem[];
}

export function diff(
  remote: RemoteTemplateItem[],
  local: LocalTemplateItem[]
): DiffResult {
  const added: LocalTemplateItem[] = [];
  const removed: RemoteTemplateItem[] = [];
  const updated: LocalTemplateItem[] = [];
  const unchanged: RemoteTemplateItem[] = [];

  for (const target of local) {
    const found = findEqualReference(remote, target);
    if (!found) {
      added.push(target);
    }
  }

  for (const target of remote) {
    const found = findEqualReference(local, target);
    if (!found) {
      removed.push(target);
    } else {
      // This else block can appear in either for-loop actually.
      if (target.content_md5 === found.content_md5) {
        unchanged.push(target);
      } else {
        updated.push(found);
      }
    }
  }

  return { added, removed, updated, unchanged };
}

async function reuseAndUploadTemplateItems(
  local: LocalTemplateItem[],
  unchanged: RemoteTemplateItem[]
): Promise<TemplateItem[]> {
  const output = [];

  for (const item of local) {
    const found = findEqualReference(unchanged, item);
    if (found) {
      output.push({
        ...item,
        uri: found.uri,
      });
    } else {
      const uri = await cliContainer.uploadTemplate(item.filePath);
      output.push({
        ...item,
        uri,
      });
    }
  }

  return output;
}

async function run(argv: Arguments) {
  const appName = argv.context.app || "";
  const remoteTemplates = await cliContainer.getTemplates(appName);
  const templateDir = argv.dir as string;
  const localTemplatePaths: string[] = [];
  await collectTemplatePaths(templateDir, localTemplatePaths, 2);

  const localTemplateItems: LocalTemplateItem[] = [];
  for (const templatePath of localTemplatePaths) {
    localTemplateItems.push(
      await localTemplatePathToLocalTemplateItem(templatePath, templateDir)
    );
  }

  const { added, removed, updated, unchanged } = diff(
    remoteTemplates,
    localTemplateItems
  );

  printTemplateItems(added, "Templates to be added:", templateDir);
  printTemplateItems(removed, "Templates to be removed:", templateDir);
  printTemplateItems(updated, "Templates to be updated:", templateDir);
  printTemplateItems(unchanged, "Unchanged templates:", templateDir);

  // No changes at all
  if (added.length === 0 && removed.length === 0 && updated.length === 0) {
    console.log("No changes at all");
    return;
  }

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

  const templateItemsToPut = await reuseAndUploadTemplateItems(
    localTemplateItems,
    unchanged
  );
  await cliContainer.putTemplates(appName, templateItemsToPut);
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
  command: "update-templates",
  describe: "Update templates",
  handler: run,
});
