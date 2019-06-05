import globby from '@skygeario/globby';
import chalk from 'chalk';
import crypto from 'crypto';
import fs from 'fs';
import inquirer from 'inquirer';
import os from 'os';
import path from 'path';
import tar from 'tar';

import { controller } from '../../api';
import {
  App,
  Checksum,
  CLIContext,
  DeploymentItemConfig,
  DeploymentItemsResponse,
  DeploymentStatus
} from '../../types';
import { Arguments, createCommand } from '../../util';
import requireUser from '../middleware/requireUser';

function createArchivePath(index: number) {
  return path.join(os.tmpdir(), `skygear-src-${index}.tgz`);
}

function createArchiveReadStream(archivePath: string) {
  return fs.createReadStream(archivePath);
}

function archiveSrc(srcPath: string, archivePath: string) {
  return globby(srcPath, {
    dot: true,
    gitignore: true,
    gitignoreName: '.skyignore'
  })
    .then((paths: string[]) => {
      // globby returns path relative to the current dir
      // transform the path relative to srcPath for archive
      return paths.map((p) => path.relative(srcPath, p));
    })
    .then((paths: string[]) => {
      const opt = {
        cwd: srcPath,
        file: archivePath,
        gzip: true,
        // set portable to true, so the archive is the same for same content
        portable: true
      };
      return tar.c(opt, paths);
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

async function archiveCloudCode(
  name: string,
  cloudCode: DeploymentItemConfig,
  archivePath: string
): Promise<Checksum> {
  console.log(chalk`Archiving cloud code: {green ${name}}`);
  await archiveSrc(cloudCode.src, archivePath);
  const checksum = await getChecksum(archivePath);
  console.log(`Archive checksum md5: ${checksum.md5}`);
  console.log(`Archive checksum sha256: ${checksum.sha256}`);
  return checksum;
}

function waitForDeploymentStatus(context: CLIContext, cloudCodeID: string) {
  console.log(chalk`Wait for deployment: {green ${cloudCodeID}}`);
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
  newItems: string[]
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
  const deploymentItemsResp: DeploymentItemsResponse = await controller.getDeploymentItems(
    context,
    app.lastDeploymentID
  );

  const itemsWillBeRemoved: string[] = deploymentItemsResp.cloudCodes.reduce(
    (acc: string[], oldItem) => {
      if (newItems.indexOf(oldItem.name) === -1) {
        acc.push(oldItem.name);
      }
      return acc;
    },
    []
  );

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

  return;
}

/* Log deployment log
function downloadDeployLog(
  context: CLIContext,
  cloudCodeID: string
): Promise<Response> {
  return new Promise((resolve) =>
    downloadDeployLogImpl(context, cloudCodeID, resolve)
  );
}

function downloadDeployLogImpl(
  context: CLIContext,
  cloudCodeID: string,
  // tslint:disable-next-line:no-any
  resolve: any
) {
  controller
    .downloadDeployLog(context, cloudCodeID)
    .then(resolve)
    .catch(() => {
      setTimeout(() => {
        console.log(`Failed to download deploy log, will retry later`);
        downloadDeployLogImpl(context, cloudCodeID, resolve);
      }, 3000);
    });
}
*/

async function run(argv: Arguments) {
  const deploymentMap = argv.appConfig.deployments || {};
  if (!Object.keys(deploymentMap).length) {
    throw new Error('No deployment items to be deployed.');
  }

  try {
    const itemNames: string[] = Object.keys(deploymentMap);
    await confirmIfItemsWillBeRemovedInNewDeployment(argv.context, itemNames);

    const checksums: Checksum[] = [];

    // archive and get checksum
    for (let i = 0; i < itemNames.length; i++) {
      const name = itemNames[i];
      const deployment = deploymentMap[name];
      const archivePath = createArchivePath(i);
      const checksum = await archiveCloudCode(name, deployment, archivePath);
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
      artifactIDMap
    );

    // wait for deployment status
    const deploymentStatus = await waitForDeploymentStatus(
      argv.context,
      deploymentID
    );

    if (deploymentStatus === DeploymentStatus.Running) {
      console.log(chalk`Deployment completed`);
      return;
    } else {
      throw new Error('Deployment failed');
    }

    /* Load deployment log
    console.log(chalk`Downloading deploy log`);
    const logResp = await downloadDeployLog(argv.context, cloudCodeID);
    console.log(chalk`Deploy log:`);
    await new Promise((resolve, reject) => {
      logResp.body
        .on('data', (data) => {
          console.log(data.toString('utf-8'));
        })
        .on('error', reject)
        .on('finish', resolve);
    });
    */
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
