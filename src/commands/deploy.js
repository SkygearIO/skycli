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
import fs from 'fs-extra';
import chalk from 'chalk';
import archiver from 'archiver';
import globby from '@skygeario/globby';
import tmp from 'tmp';

import { controller, asset } from '../api';
import { createCommand } from '../util';

function makeArchive(app) {
  // create a file to stream archive data to.
  const {
    name: tarPath
  } = tmp.fileSync({
    discardDescriptor: true,
    prefix: `${app}-deploy-`,
    postfix: '.tar.gz'
  });
  var output = fs.createWriteStream(tarPath);
  var archive = archiver('tar', {
    gzip: true
  });

  // listen for all archive data to be written
  output.on('close', () => {
    // print something?
  });

  // good practice to catch warnings (ie stat failures and other non-blocking errors)
  archive.on('warning', (err) => {
    if (err.code === 'ENOENT') {
      // log warning
    } else {
      // throw error
      throw err;
    }
  });

  // good practice to catch this error explicitly
  archive.on('error', (err) => {
    throw err;
  });

  // pipe archive data to the file
  archive.pipe(output);

  return globby('**', {
    gitignore: true,
    gitignoreName: '.skyignore'
  }).then((paths) => {
    paths.forEach((path) => {
      archive.file(path);
    });
    // finalize the archive (ie we are done appending files but streams have to finish yet)
    return archive.finalize();
  }).then(() => {
    return tarPath;
  });
}

function waitForBuildJob(appName, token) {
  return new Promise((resolve, reject) => {
    waitForBuildJobImpl(appName, token, resolve, reject);
  });
}

function waitForBuildJobImpl(appName, token, resolve, reject) {
  controller.appStatus(appName, token)
    .then((result) => {
      const buildJobStatus = result.lastBuildJobStatus.status;
      if (buildJobStatus === 'success' || buildJobStatus === 'failed') {
        resolve(result.lastBuildJobStatus);
        return;
      }

      setTimeout(() => {
        waitForBuildJobImpl(appName, token, resolve, reject);
      }, 5000);
    }, (err) => {
      reject(err);
    });
}

function run(argv) {
  var tarPath;
  var artifactRequest;
  var success;
  const appName = argv.project.app;

  console.log('Creating an archive of your cloud code...');
  const token = argv.currentAccount.token;
  return makeArchive(appName)
    .then((result) => {
      tarPath = result;
      if (argv.debug) {
        console.log(`Archive saved at ${tarPath}.`);
      }

      return controller.createArtifactUpload(appName, token);
    })
    .then((result) => {
      console.log('Uploading archive to Skygear Cloud...');
      const uploadRequest = result.upload_request;
      artifactRequest = result.artifact_request;
      return asset.upload(uploadRequest, fs.readFileSync(tarPath));
    })
    .then(() => {
      console.log('We are creating a new build for your app...');
      return controller.createArtifact(artifactRequest, appName, token);
    })
    .then(() => {
      return controller.createBuildJob(null, appName, token);
    })
    .then(() => {
      console.log('Waiting for build to complete...');
      return waitForBuildJob(appName, token);
    })
    .then((result) => {
      const {
        status,
        log_url: logUrl
      } = result;

      success = status === 'success';

      console.log('Downloading build log...');
      return asset.download(logUrl);
    })
    .then((buildLog) => {
      console.log(buildLog);
      if (success) {
        console.log(chalk.green('Build completed successfully.'));
        success = true;
      } else {
        console.log(chalk.red('Build failed.'));
      }
    })
    .then(() => {
      fs.unlinkSync(tarPath);
    });
}

export default createCommand({
  command: 'deploy',
  desc: 'Deploy skygear project to cloud.',
  builder: (yargs) => {
    return yargs;
  },
  handler: run
});
