import chalk from 'chalk';
import crypto from 'crypto';
import fs from 'fs-extra';
import inquirer from 'inquirer';
import path from 'path';
import zlib from 'zlib';
import * as tar from 'tar-fs';

import { isHTTP404 } from '../../error';
import { CLIContext } from '../../types';
import { Arguments, createCommand } from '../../util';
import requireUser from '../middleware/requireUser';
import { walk, dockerignore, dockerignorePaths } from '../../ignore';
import { cliContainer } from '../../container';
import {
  DeploymentStatus,
  Checksum,
  LogEntry,
  DeploymentItemsMap,
  DeploymentItemConfig,
  HttpServiceConfig
} from '../../container/types';
import { tempPath } from '../../path';

const gunzip = require('gunzip-maybe');

function createArchivePath(index: number) {
  return tempPath(`skygear-src-${index}.tgz`);
}

function createArchiveReadStream(archivePath: string) {
  return fs.createReadStream(archivePath);
}

function archiveCloudCodeSrc(srcPath: string, archivePath: string) {
  return dockerignore(srcPath, '.skyignore').then((paths: string[]) => {
    return createTar({ srcPath: paths }, archivePath);
  });
}

// By reading the microservice deployment config
// Create map that entries for archive
// key is the folder path
// value is array of pathnames that relative to the folder
export async function createFolderToPathsMapForArchive(
  config: HttpServiceConfig,
  templateFolderPath: string | null = null
): Promise<{ [folder: string]: string[] }> {
  const folderToPathsMap: { [folder: string]: string[] } = {};

  // add user code to map
  // if there is template, use user provided `.skyignore` to ignore files
  folderToPathsMap[config.context] = templateFolderPath
    ? await dockerignore(config.context, '.skyignore')
    : await walk(config.context);

  if (templateFolderPath) {
    folderToPathsMap[templateFolderPath] = await walk(templateFolderPath);
  }

  // filter paths by dockeringore
  // Check files duplicate
  // Verify dockerfile exist
  const dockerfile: string = config.dockerfile || 'Dockerfile';
  // path.join("./a/b") === "a/b";
  // We need to ensure the path is implicit
  // because the value in paths are all implicit
  // A path is implicit is it is relative and does not start with "./"
  const dockerfilePath = path.join(dockerfile);
  const pathsSet = new Set();
  let hasDockerfile = false;
  for (const folder of Object.keys(folderToPathsMap)) {
    // eslint-disable-next-line no-await-in-loop
    const filtered = await dockerignorePaths(
      folderToPathsMap[folder],
      path.join(templateFolderPath || config.context, '.dockerignore')
    );
    folderToPathsMap[folder] = filtered;
    for (const p of folderToPathsMap[folder]) {
      // throw error if file duplicate
      if (pathsSet.has(p)) {
        throw Error(
          `${p} is reserved file, please remove it from folder ${
            config.context
          }`
        );
      }
      pathsSet.add(p);
      hasDockerfile = hasDockerfile || p === dockerfilePath;
    }
  }

  if (!hasDockerfile) {
    throw new Error(
      'expected dockerfile to exists: ' +
        path.join(config.context, dockerfilePath)
    );
  }

  return folderToPathsMap;
}

async function archiveMicroserviceSrc(
  config: HttpServiceConfig,
  archivePath: string,
  templateFolderPath: string | null = null
) {
  const folderToPathsMap = await createFolderToPathsMapForArchive(
    config,
    templateFolderPath
  );
  return createTar(folderToPathsMap, archivePath);
}

async function createTar(
  folderToPathsMap: { [folder: string]: string[] },
  archivePath: string
): Promise<void> {
  return new Promise((resolve, reject) => {
    const z = zlib.createGzip();
    const folders = Object.keys(folderToPathsMap);
    createPack(folders, folderToPathsMap, null, 0)
      .pipe(z)
      .pipe(fs.createWriteStream(archivePath))
      .on('error', reject)
      .on('finish', resolve);
  });
}

function createPack(
  folders: string[],
  folderToPathsMap: { [folder: string]: string[] },
  pack?: any,
  cur: number = 0
): any {
  const folder = folders[cur];
  const paths = folderToPathsMap[folder];
  const finalize = cur >= folders.length - 1;
  return tar.pack(folder, {
    finalize: finalize,
    finish: function(partsOfPack: any) {
      cur += 1;
      if (!finalize) {
        createPack(folders, folderToPathsMap, partsOfPack, cur);
      }
    },
    pack: pack,
    entries: paths
  });
}

function getChecksum(archivePath: string): Promise<Checksum> {
  const md5 = crypto.createHash('md5');
  const sha256 = crypto.createHash('sha256');
  return new Promise((resolve, reject) => {
    try {
      const stream = createArchiveReadStream(archivePath);
      stream.on('data', (data) => {
        md5.update(data, 'utf8');
        sha256.update(data, 'utf8');
      });

      stream.on('end', () => {
        resolve({
          md5: md5.digest('base64'),
          sha256: sha256.digest('base64')
        });
      });

      stream.on('error', (err: Error) => {
        reject(err);
      });
    } catch (error) {
      reject(error);
    }
  });
}

async function archiveDeploymentItem(
  name: string,
  deployment: DeploymentItemConfig,
  archivePath: string
): Promise<Checksum> {
  console.log(chalk`Archiving cloud code: {green ${name}}`);
  switch (deployment.type) {
    case 'http-handler':
      await archiveCloudCodeSrc(deployment.src, archivePath);
      break;
    case 'http-service':
      await archiveMicroserviceSrc(
        deployment,
        archivePath,
        deployment.template && createTemplatePath(deployment.template)
      );
      break;
    default:
      throw new Error('unexpected type');
  }
  const checksum = await getChecksum(archivePath);
  console.log(`Archive checksum md5: ${checksum.md5}`);
  console.log(`Archive checksum sha256: ${checksum.sha256}`);
  return checksum;
}

function waitForDeploymentStatus(context: CLIContext, cloudCodeID: string) {
  return new Promise((resolve, reject) =>
    waitForDeploymentStatusImpl(context, cloudCodeID, resolve, reject)
  );
}

function waitForDeploymentStatusImpl(
  context: CLIContext,
  deploymentID: string,
  // tslint:disable-next-line:no-any
  resolve: any,
  // tslint:disable-next-line:no-any
  reject: any
) {
  cliContainer.getDeployment(deploymentID).then(
    (result) => {
      if (
        result.status === DeploymentStatus.Running ||
        result.status === DeploymentStatus.DeployFailed
      ) {
        resolve(result.status);
        return;
      }

      if (result.status !== DeploymentStatus.Pending) {
        reject(new Error(`Unexpected cloud code status: ${result.status}`));
        return;
      }

      setTimeout(() => {
        waitForDeploymentStatusImpl(context, deploymentID, resolve, reject);
      }, 3000);
    },
    (err) => {
      reject(err);
    }
  );
}

async function confirmIfItemsWillBeRemovedInNewDeployment(
  appName: string,
  deployments: DeploymentItemsMap
) {
  if (!appName) {
    return;
  }

  const app = await cliContainer.getAppByName(appName);
  if (!app.last_deployment_id) {
    // no last deployment, no need to check
    return;
  }

  // get deployment items and show prompt if needed
  const existingDeployments = await cliContainer.getDeploymentItems(
    app.last_deployment_id
  );

  const itemsWillBeRemoved: string[] = [];
  for (const itemName of Object.keys(existingDeployments)) {
    // item is considered removed if
    // itemName is found in existing deployment but not found in new deployment
    // or
    // itemName is found in both deployment but the types differ.
    const existingItem = existingDeployments[itemName];
    const newItem = deployments[itemName];
    if (!newItem || existingItem.type !== newItem.type) {
      itemsWillBeRemoved.push(itemName);
    }
  }

  if (itemsWillBeRemoved.length) {
    const applyItemColor = (str: string) => chalk.green(str);
    const answers = await inquirer.prompt([
      {
        message: `Item(s) ${itemsWillBeRemoved
          .map(applyItemColor)
          .join(', ')} will be removed in this deployment. Confirm?`,
        name: 'proceed',
        type: 'confirm'
      }
    ]);

    if (!answers.proceed) {
      throw new Error('cancelled');
    }
  }
}

function createTemplatePath(templateName: string) {
  return tempPath('skygear-templates', encodeURIComponent(templateName));
}

async function downloadTemplateIfNeeded(
  deployments: DeploymentItemsMap,
  cacheTemplate: boolean = false
) {
  const templatesToDownloadSet = new Set<string>();
  for (const itemName of Object.keys(deployments)) {
    const d = deployments[itemName];
    if (d.type === 'http-service' && d.template) {
      templatesToDownloadSet.add(d.template);
    }
  }

  for (const templateName of Array.from(templatesToDownloadSet)) {
    const templateDir = createTemplatePath(templateName);
    if (cacheTemplate && fs.existsSync(templateDir)) {
      // use the cache, skip downloading
      continue;
    }

    fs.removeSync(templateDir);
    fs.ensureDirSync(templateDir);

    // eslint-disable-next-line no-await-in-loop
    const resp = await cliContainer.downloadTemplate(templateName);

    // eslint-disable-next-line no-await-in-loop
    await new Promise((resolve, reject) => {
      resp.body
        .pipe(gunzip())
        .pipe(tar.extract(templateDir, { strip: true }))
        .on('error', reject)
        .on('finish', resolve);
    });
  }
}

function downloadDeployLog(
  context: CLIContext,
  deploymentID: string,
  onLogReceive: (log: LogEntry) => void
): Promise<Response> {
  return new Promise((resolve, reject) =>
    downloadDeployLogImpl(context, deploymentID, onLogReceive, resolve, reject)
  );
}

function downloadDeployLogImpl(
  context: CLIContext,
  deploymentID: string,
  onLogReceive: (log: LogEntry) => void,
  // tslint:disable-next-line:no-any
  resolve: any,
  // tslint:disable-next-line:no-any
  reject: any
) {
  cliContainer
    .downloadDeployLog(deploymentID, onLogReceive)
    .then(resolve)
    .catch((err) => {
      // retry when the log is not found, wait for the deployment start
      if (isHTTP404(err)) {
        if (context.debug) {
          console.log(`Failed to download deploy log, will retry later`);
        }
        setTimeout(() => {
          downloadDeployLogImpl(
            context,
            deploymentID,
            onLogReceive,
            resolve,
            reject
          );
        }, 3000);
      } else {
        reject(err);
      }
    });
}

async function run(argv: Arguments) {
  const deploymentMap = argv.appConfig.deployments || {};
  const hooks = argv.appConfig.hooks || [];
  const appName = argv.context.app || '';

  await cliContainer.validateDeployment(appName, deploymentMap, hooks);

  try {
    const itemNames: string[] = Object.keys(deploymentMap);
    await confirmIfItemsWillBeRemovedInNewDeployment(appName, deploymentMap);

    await downloadTemplateIfNeeded(deploymentMap);

    const checksums: Checksum[] = [];

    // archive and get checksum
    for (let i = 0; i < itemNames.length; i++) {
      const name = itemNames[i];
      const deployment = deploymentMap[name];
      const archivePath = createArchivePath(i);
      fs.ensureFileSync(archivePath);
      // eslint-disable-next-line no-await-in-loop
      const checksum = await archiveDeploymentItem(
        name,
        deployment,
        archivePath
      );
      checksums.push(checksum);
    }

    // create artifact upload
    const uploads = await cliContainer.createArtifactUploads(
      appName,
      checksums
    );

    // upload artifact
    const artifactRequests: string[] = [];
    for (let i = 0; i < checksums.length; i++) {
      const checksum = checksums[i];
      const upload = uploads[i];
      const archivePath = createArchivePath(i);
      // eslint-disable-next-line no-await-in-loop
      await cliContainer.uploadArtifact(
        upload.uploadRequest,
        checksum.md5,
        archivePath
      );
      const currentProgress = i + 1;
      console.log(`Archive uploaded (${currentProgress}/${checksums.length})`);
      artifactRequests.push(upload.artifactRequest);
    }

    // create artifacts
    const artifactIDs = await cliContainer.createArtifacts(
      appName,
      artifactRequests
    );
    const artifactIDMap: { [name: string]: string } = {};
    for (let i = 0; i < itemNames.length; i++) {
      const name = itemNames[i];
      artifactIDMap[name] = artifactIDs[i];
    }

    // create deployment
    const deploymentID = await cliContainer.createDeployment(
      appName,
      deploymentMap,
      artifactIDMap,
      hooks
    );

    console.log(chalk`Wait for deployment: {green ${deploymentID}}`);
    await downloadDeployLog(argv.context, deploymentID, (log) => {
      if (log.message) {
        console.log(log.message);
      }
    });

    // wait for deployment status
    const deploymentStatus = await waitForDeploymentStatus(
      argv.context,
      deploymentID
    );

    if (deploymentStatus === DeploymentStatus.Running) {
      console.log(chalk`Deployment completed`);
      return;
    }
    throw new Error('Deployment failed');
  } catch (error) {
    if (error.message === 'cancelled') {
      return;
    }
    throw error;
  }
}

export default createCommand({
  builder: (yargs) => {
    return yargs.middleware(requireUser).option('app', {
      desc: 'App name',
      type: 'string'
    });
  },
  command: 'deploy [name]',
  describe: 'Deploy Skygear app',
  handler: run
});
