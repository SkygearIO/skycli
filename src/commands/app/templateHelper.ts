import { join } from "path";

import { TemplateItem } from "../../container/types";

export function templateItemToLocalTemplatePath(
  templateItem: TemplateItem,
  templateDir: string
): string {
  const parts = [];

  if (templateItem.key) {
    parts.push(templateItem.key);
  }

  parts.push(templateItem.type);

  return join(templateDir, ...parts);
}

export function isEqualReference(a: TemplateItem, b: TemplateItem): boolean {
  return (
    a.type === b.type && a.key === b.key && a.language_tag === b.language_tag
  );
}

export function findEqualReference<
  T1 extends TemplateItem,
  T2 extends TemplateItem
>(items: T1[], target: T2): T1 | undefined {
  return items.find(item => isEqualReference(item, target));
}

export function printTemplateItems(
  templateItems: TemplateItem[],
  title: string,
  templateDir: string
) {
  if (templateItems.length <= 0) {
    return;
  }
  console.log(title);
  for (const item of templateItems) {
    console.log("\t" + templateItemToLocalTemplatePath(item, templateDir));
  }
  console.log();
}
