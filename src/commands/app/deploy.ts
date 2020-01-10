import chalk from "chalk";
import crypto from "crypto";
import fs from "fs-extra";
import inquirer from "inquirer";
import path from "path";
import zlib from "zlib";
import * as tar from "tar-fs";

import { isHTTP404 } from "../../error";
import { CLIContext } from "../../types";
import { Arguments, createCommand } from "../../util";
import requireUser from "../middleware/requireUser";
import { walk, dockerignore, dockerignorePaths } from "../../ignore";
import { cliContainer } from "../../container";
import {
  ArtifactRequest,
  DeploymentStatus,
  Checksum,
  LogEntry,
  DeploymentItemConfig,
  DeploymentItemArtifact,
  HttpServiceConfig,
} from "../../container/types";
import { tempPath } from "../../path";

const gunzip = require("gunzip-maybe");

function createArchivePath(name: string) {
  return tempPath(`skygear-src-${name}.tgz`);
}

function createArchiveReadStream(archivePath: string) {
  return fs.createReadStream(archivePath);
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

  if (!config.context) {
    throw Error("http-service missing context");
  }

  // add user code to map
  // if there is template, use user provided `.skyignore` to ignore files
  folderToPathsMap[config.context] = templateFolderPath
    ? await dockerignore(config.context, ".skyignore")
    : await walk(config.context);

  if (templateFolderPath) {
    folderToPathsMap[templateFolderPath] = await walk(templateFolderPath);
  }

  // filter paths by dockeringore
  // Check files duplicate
  // Verify dockerfile exist
  const dockerfile: string = config.dockerfile || "Dockerfile";
  // path.join("./a/b") === "a/b";
  // We need to ensure the path is implicit
  // because the value in paths are all implicit
  // A path is implicit is it is relative and does not start with "./"
  const dockerfilePath = path.join(dockerfile);
  const pathsSet = new Set();
  let hasDockerfile = false;
  for (const folder of Object.keys(folderToPathsMap)) {
    const filtered = await dockerignorePaths(
      folderToPathsMap[folder],
      path.join(templateFolderPath || config.context, ".dockerignore")
    );
    folderToPathsMap[folder] = filtered;
    for (const p of folderToPathsMap[folder]) {
      // throw error if file duplicate
      if (pathsSet.has(p)) {
        throw Error(
          `${p} is reserved file, please remove it from folder ${config.context}`
        );
      }
      pathsSet.add(p);
      hasDockerfile = hasDockerfile || p === dockerfilePath;
    }
  }

  if (!hasDockerfile) {
    throw new Error(
      "expected dockerfile to exists: " +
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
      .on("error", reject)
      .on("finish", resolve);
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
    entries: paths,
  });
}

function getChecksum(archivePath: string): Promise<Checksum> {
  const md5 = crypto.createHash("md5");
  const sha256 = crypto.createHash("sha256");
  return new Promise((resolve, reject) => {
    try {
      const stream = createArchiveReadStream(archivePath);
      stream.on("data", data => {
        md5.update(data, "utf8");
        sha256.update(data, "utf8");
      });

      stream.on("end", () => {
        resolve({
          md5: md5.digest("base64"),
          sha256: sha256.digest("base64"),
        });
      });

      stream.on("error", (err: Error) => {
        reject(err);
      });
    } catch (error) {
      reject(error);
    }
  });
}

// archive deployment item if needed
// for item that doesn't have artifact, null will be returned
async function archiveDeploymentItem(
  name: string,
  deployment: DeploymentItemConfig,
  archivePath: string
): Promise<Checksum | null> {
  console.log(chalk`Archiving cloud code: {green ${name}}`);
  switch (deployment.type) {
    case "http-service":
      if (deployment.context) {
        fs.ensureFileSync(archivePath);
        await archiveMicroserviceSrc(
          deployment,
          archivePath,
          deployment.template && createTemplatePath(deployment.template)
        );
      } else {
        return null;
      }
      break;
    default:
      throw new Error("unexpected type");
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
  resolve: any,
  reject: any
) {
  // context.app is ensured by the middleware
  // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
  cliContainer.getDeployment(context.app!, deploymentID).then(
    result => {
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
    err => {
      reject(err);
    }
  );
}

async function confirmIfItemsWillBeRemovedInNewDeployment(
  appName: string,
  deployments: DeploymentItemConfig[]
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
    appName,
    app.last_deployment_id
  );

  const itemsWillBeRemoved: string[] = [];
  for (const existingItem of existingDeployments) {
    // item is considered removed if
    // itemName is found in existing deployment but not found in new deployment
    // or
    // itemName is found in both deployment but the types differ.
    const newItem = deployments.find(a => a.name === existingItem.name);
    if (!newItem || existingItem.type !== newItem.type) {
      itemsWillBeRemoved.push(existingItem.name);
    }
  }

  if (itemsWillBeRemoved.length) {
    const applyItemColor = (str: string) => chalk.green(str);
    const answers = await inquirer.prompt([
      {
        message: `Item(s) ${itemsWillBeRemoved
          .map(applyItemColor)
          .join(", ")} will be removed in this deployment. Confirm?`,
        name: "proceed",
        type: "confirm",
      },
    ]);

    if (!answers.proceed) {
      throw new Error("cancelled");
    }
  }
}

function createTemplatePath(templateName: string) {
  return tempPath("skygear-templates", encodeURIComponent(templateName));
}

async function downloadTemplateIfNeeded(
  deployments: DeploymentItemConfig[],
  cacheTemplate: boolean = false
) {
  const templatesToDownloadSet = new Set<string>();
  for (const d of deployments) {
    if (d.type === "http-service" && d.template) {
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

    const resp = await cliContainer.downloadTemplate(templateName);

    await new Promise((resolve, reject) => {
      resp.body
        .pipe(gunzip())
        .pipe(tar.extract(templateDir, { strip: true }))
        .on("error", reject)
        .on("finish", resolve);
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
  resolve: any,
  reject: any
) {
  cliContainer
    // context.app is ensured by the middleware
    // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
    .downloadDeployLog(context.app!, deploymentID, onLogReceive)
    .then(resolve)
    .catch(err => {
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
  const { skygearYAML } = argv.context;
  const deployments = skygearYAML.deployments || [];
  const appName = argv.context.app || "";

  await cliContainer.validateDeployment(appName, skygearYAML);

  try {
    await confirmIfItemsWillBeRemovedInNewDeployment(appName, deployments);

    await downloadTemplateIfNeeded(deployments);

    const artifactItems: {
      artifact: ArtifactRequest;
      deployItemName: string;
      archivePath: string;
    }[] = [];
    // archive and get checksum
    for (const deployItem of deployments) {
      const archivePath = createArchivePath(deployItem.name);
      const checksum = await archiveDeploymentItem(
        deployItem.name,
        deployItem,
        archivePath
      );
      if (checksum) {
        artifactItems.push({
          artifact: {
            checksum_md5: checksum.md5,
            checksum_sha256: checksum.sha256,
            asset_name: "",
          },
          deployItemName: deployItem.name,
          archivePath: archivePath,
        });
      }
    }

    // upload artifact
    for (let i = 0; i < artifactItems.length; i++) {
      const archivePath = artifactItems[i].archivePath;
      const assetName = await cliContainer.uploadArtifact(archivePath);
      const currentProgress = i + 1;
      console.log(
        `Archive uploaded (${currentProgress}/${artifactItems.length})`
      );
      artifactItems[i].artifact.asset_name = assetName;
    }

    // create artifacts
    const deploymentItemArtifacts: DeploymentItemArtifact[] = [];
    if (artifactItems.length > 0) {
      const artifactResponses = await cliContainer.createArtifacts(
        appName,
        artifactItems.map(a => a.artifact)
      );
      for (let i = 0; i < artifactItems.length; i++) {
        deploymentItemArtifacts.push({
          deploy_item_name: artifactItems[i].deployItemName,
          artifact_id: artifactResponses[i].id,
        });
      }
    }

    // create deployment
    const deploymentID = await cliContainer.createDeployment(
      appName,
      skygearYAML,
      deploymentItemArtifacts
    );

    console.log(chalk`Wait for deployment: {green ${deploymentID}}`);
    await downloadDeployLog(argv.context, deploymentID, log => {
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
    throw new Error("Deployment failed");
  } catch (error) {
    if (error.message === "cancelled") {
      return;
    }
    throw error;
  }
}

export default createCommand({
  builder: yargs => {
    return yargs.middleware(requireUser).option("app", {
      desc: "App name",
      type: "string",
    });
  },
  command: "deploy [name]",
  describe: "Deploy Skygear app",
  handler: run,
});
