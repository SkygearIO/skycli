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
  TemplateSpec,
} from "../../container/types";
import { digestOfFilePath } from "../../digest";
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
    const filePaths = basenames.map((basename) => join(filePath, basename));
    for (const p of filePaths) {
      await collectTemplatePaths(p, output, depth - 1);
    }
  } else if (stats.isFile() || stats.isSymbolicLink()) {
    output.push(filePath);
  }
}

async function localTemplatePathToLocalTemplateItem(
  templatePath: string,
  templateDir: string,
  typeToSpec: { [type: string]: TemplateSpec }
): Promise<LocalTemplateItem> {
  const p = relative(templateDir, templatePath);
  const parts = p.split(sep);

  if (parts.length <= 0) {
    throw new Error("unexpected template: " + p);
  }

  const type = parts.pop()!;
  const spec = typeToSpec[type];
  if (!spec) {
    throw new Error("unexpected template: " + p);
  }

  let key;
  let language_tag;
  if (spec.is_keyed && parts.length > 0) {
    key = parts.pop();
  }
  if (parts.length > 0) {
    language_tag = parts.pop();
  }

  if (parts.length !== 0) {
    throw new Error("unexpected template: " + p);
  }

  const digest = await digestOfFilePath(templatePath);

  return {
    type,
    key,
    language_tag,
    digest,
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
      if (target.digest === found.digest) {
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
  const { specs: gearSpecs, items } = await cliContainer.getTemplates(appName);
  const typeToSpec: { [type: string]: TemplateSpec } = {};
  for (const specs of Object.values(gearSpecs)) {
    for (const spec of specs) {
      typeToSpec[spec.type] = spec;
    }
  }

  const templateDir = argv.dir as string;
  const localTemplatePaths: string[] = [];
  await collectTemplatePaths(templateDir, localTemplatePaths, 2);

  const localTemplateItems: LocalTemplateItem[] = [];
  for (const templatePath of localTemplatePaths) {
    localTemplateItems.push(
      await localTemplatePathToLocalTemplateItem(
        templatePath,
        templateDir,
        typeToSpec
      )
    );
  }

  const { added, removed, updated, unchanged } = diff(
    items,
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
  builder: (yargs) => {
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
