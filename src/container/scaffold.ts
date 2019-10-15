import fs from 'fs-extra';
import { dataPath } from '../path';
import fetch from 'node-fetch';
import * as tar from 'tar-fs';
import gunzip from 'gunzip-maybe';
import { join } from 'path';

const templateGitHubRepo = 'skygear-demo/cloud-examples';

const versionFilePath = dataPath('templates-version');
const templatesDir = dataPath('templates');

export interface ScaffoldingTemplate {
  name: string;
  path: string;
  description: string;
}

export interface TemplateVersionCheckResult {
  currentVersion: string | undefined;
  latestVersion: string | undefined;
}

export async function checkTemplateVersion(): Promise<
  TemplateVersionCheckResult
> {
  let currentVersion: string | undefined;
  if (fs.existsSync(versionFilePath)) {
    currentVersion = fs.readFileSync(versionFilePath).toString();
  }

  let latestVersion: string | undefined;
  const masterRefURL = `https://api.github.com/repos/${templateGitHubRepo}/git/refs/heads/master`;
  const resp = await fetch(masterRefURL);
  if (resp.status === 200) {
    latestVersion = String((await resp.json()).object.sha);
  }

  return { currentVersion, latestVersion };
}

export async function updateTemplates(version: string): Promise<void> {
  const tarballURL = `https://api.github.com/repos/${templateGitHubRepo}/tarball/${version}`;
  const resp = await fetch(tarballURL);
  if (resp.status !== 200) {
    throw new Error('Failed to fetch templates tarball');
  }

  fs.removeSync(templatesDir);
  await new Promise((resolve, reject) => {
    resp.body
      .pipe(gunzip())
      .pipe(tar.extract(templatesDir, { strip: true }))
      .on('error', reject)
      .on('finish', resolve);
  });

  fs.writeFileSync(versionFilePath, version);
}

export function listTemplates(): ScaffoldingTemplate[] {
  const templateJSONPath = join(templatesDir, 'templates.json');
  return fs.readJSONSync(templateJSONPath);
}

export function instantiateTemplate(
  template: ScaffoldingTemplate,
  path: string
) {
  const templateDir = join(templatesDir, template.path);
  fs.copySync(templateDir, path);
}
