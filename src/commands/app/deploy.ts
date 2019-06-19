import chalk from 'chalk';
import crypto from 'crypto';
import fs from 'fs';
import inquirer from 'inquirer';
import os from 'os';
import path from 'path';
import tar from 'tar';

import { isHTTP404 } from '../../error';
import { controller } from '../../api';
import {
  App,
  Checksum,
  CLIContext,
  HttpServiceConfig,
  Deployments,
  DeploymentItemConfig,
  DeploymentStatus,
  LogEntry
} from '../../types';
import { Arguments, createCommand } from '../../util';
import requireUser from '../middleware/requireUser';
import { skyignore, dockerignore } from '../../ignore';

function createArchivePath(index: number) {
  return path.join(os.tmpdir(), `skygear-src-${index}.tgz`);
}

function createArchiveReadStream(archivePath: string) {
  return fs.createReadStream(archivePath);
}

async function tarCreate(options: {
  cwd: string;
  file: string;
  paths: string[];
}): Promise<void> {
  const opt = {
    cwd: options.cwd,
    file: options.file,
    gzip: true,
    // set portable to true, so the archive is the same for same content
    portable: true
  };
  await tar.create(opt, options.paths);
}

function archiveCloudCodeSrc(srcPath: string, archivePath: string) {
  return skyignore(srcPath).then((paths: string[]) => {
    return tarCreate({
      cwd: srcPath,
      file: archivePath,
      paths
    });
  });
}

async function archiveMicroserviceSrc(
  config: HttpServiceConfig,
  archivePath: string
) {
  const paths = await dockerignore(config.context);
  // Verify dockerfile exist
  const dockerfile: string = config.dockerfile || 'Dockerfile';
  // path.join("./a/b") === "a/b";
  // We need to ensure the path is implicit
  // because the value in paths are all implicit
  // A path is implicit is it is relative and does not start with "./"
  const dockerfilePath = path.join(dockerfile);
  if (paths.indexOf(dockerfilePath) < 0) {
    throw new Error(
      'expected dockerfile to exists: ' +
        path.join(config.context, dockerfilePath)
    );
  }
  return tarCreate({
    cwd: config.context,
    file: archivePath,
    paths
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
      await archiveMicroserviceSrc(deployment, archivePath);
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
  controller.getDeployment(context, deploymentID).then(
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
  context: CLIContext,
  deployments: Deployments
) {
  const appName = context.app;
  if (!appName) {
    return;
  }

  const app: App = await controller.getAppByName(context, appName);
  if (!app.lastDeploymentID) {
    // no last deployment, no need to check
    return;
  }

  // get deployment items and show prompt if needed
  const {
    deployments: existingDeployments
  } = await controller.getDeploymentItems(context, app.lastDeploymentID);

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
  controller
    .downloadDeployLog(context, deploymentID, onLogReceive)
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

  await controller.validateDeployment(argv.context, deploymentMap, hooks);

  try {
    const itemNames: string[] = Object.keys(deploymentMap);
    await confirmIfItemsWillBeRemovedInNewDeployment(
      argv.context,
      deploymentMap
    );

    const checksums: Checksum[] = [];

    // archive and get checksum
    for (let i = 0; i < itemNames.length; i++) {
      const name = itemNames[i];
      const deployment = deploymentMap[name];
      const archivePath = createArchivePath(i);
      // eslint-disable-next-line no-await-in-loop
      const checksum = await archiveDeploymentItem(
        name,
        deployment,
        archivePath
      );
      checksums.push(checksum);
    }

    // create artifact upload
    const uploads = await controller.createArtifactUploads(
      argv.context,
      checksums
    );

    // upload artifact
    const artifactRequests: string[] = [];
    for (let i = 0; i < checksums.length; i++) {
      const checksum = checksums[i];
      const upload = uploads[i];
      const stream = createArchiveReadStream(createArchivePath(i));
      // eslint-disable-next-line no-await-in-loop
      await controller.uploadArtifact(
        upload.uploadRequest,
        checksum.md5,
        stream
      );
      const currentProgress = i + 1;
      console.log(`Archive uploaded (${currentProgress}/${checksums.length})`);
      artifactRequests.push(upload.artifactRequest);
    }

    // create artifacts
    const artifactIDs = await controller.createArtifacts(
      argv.context,
      artifactRequests
    );
    const artifactIDMap: { [name: string]: string } = {};
    for (let i = 0; i < itemNames.length; i++) {
      const name = itemNames[i];
      artifactIDMap[name] = artifactIDs[i];
    }

    // create deployment
    const deploymentID = await controller.createDeployment(
      argv.context,
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
    throw new Error('Fail to deploy. ' + error);
  }
}

export default createCommand({
  builder: (yargs) => {
    return yargs.middleware(requireUser).option('app', {
      desc: 'Application name',
      type: 'string'
    });
  },
  command: 'deploy [name]',
  describe: 'Deploy skygear application',
  handler: run
});
