import chalk from 'chalk';
import crypto from 'crypto';
import fs from 'fs';
import os from 'os';
import path from 'path';
import tar from 'tar';
import { isArray } from 'util';

import { controller } from '../../api';
import { CLIContext } from '../../types';
import { Checksum } from '../../types/artifact';
import { CloudCodeConfig } from '../../types/cloudCodeConfig';
import { Arguments, createCommand } from '../../util';
import requireUser from '../middleware/requireUser';

function archivePath() {
  return path.join(os.tmpdir(), 'skygear-src.tgz');
}

function createArchiveReadStream() {
  return fs.createReadStream(archivePath());
}

function archiveSrc(srcPath: string | string[]) {
  const opt = {
    file: archivePath(),
    gzip: true,
    // set portable to true, so the archive is the same for same content
    portable: true
  };
  return tar.c(opt, isArray(srcPath) ? srcPath : [srcPath]);
}

function getChecksum(): Promise<Checksum> {
  const md5 = crypto.createHash('md5');
  const sha256 = crypto.createHash('sha256');
  return new Promise((resolve, reject) => {
    try {
      const stream = createArchiveReadStream();
      stream.on('data', (data) => {
        md5.update(data, 'utf8');
        sha256.update(data, 'utf8');
      });

      stream.on('end', () => {
        resolve({
          md5: md5.digest('base64'),
          sha256: sha256.digest('base64'),
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

async function archiveCloudCode(name: string, cloudCode: CloudCodeConfig): Promise<Checksum> {
  console.log(chalk`Deploying cloud code: {green ${name}}`);
  await archiveSrc(cloudCode.src);
  console.log('Archive created');
  const checksum = await getChecksum();
  console.log(`Archive checksum md5: ${checksum.md5}`);
  console.log(`Archive checksum sha256: ${checksum.sha256}`);
  return checksum;
}

async function uploadArchive(context: CLIContext, checksum: Checksum) {
  console.log(chalk`Uploading archive`);
  const result = await controller.createArtifactUpload(context, checksum);
  const stream = createArchiveReadStream();
  await controller.uploadArtifact(result.uploadRequest, checksum.md5, stream);
  console.log(chalk`Archive uploaded`);
}

async function run(argv: Arguments) {
  console.log(chalk`Deploy cloud code to app: {green ${argv.context.app}}`);
  const cloudCodeMap = argv.appConfig.cloudCode || {};
  for (const name of Object.keys(cloudCodeMap)) {
    const checksum = await archiveCloudCode(name, cloudCodeMap[name]);
    await uploadArchive(argv.context, checksum);
  }
}

export default createCommand({
  builder: (yargs) => {
    return yargs.middleware(requireUser).option('app', {
      desc: 'Application name',
      type: 'string'
    });
  },
  command: 'deploy',
  describe: 'Deploy skygear cloud code',
  handler: run
});
