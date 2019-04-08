import chalk from 'chalk';
import crypto from 'crypto';
import fs from 'fs';
import os from 'os';
import path from 'path';
import tar from 'tar';
import { isArray } from 'util';

import { Checksum } from '../../types/artifact';
import { Arguments, createCommand } from '../../util';
import requireUser from '../middleware/requireUser';

function archivePath() {
  return path.join(os.tmpdir(), 'skygear-src.tgz');
}

function archiveSrc(srcPath: string | string[]) {
  const opt = {
    file: archivePath(),
    gzip: true
  };
  return tar.c(opt, isArray(srcPath) ? srcPath : [srcPath]);
}

function getChecksum(): Promise<Checksum> {
  const md5 = crypto.createHash('md5');
  const sha256 = crypto.createHash('sha256');
  return new Promise((resolve, reject) => {
    try {
      const stream = fs.createReadStream(archivePath());
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

function run(argv: Arguments) {
  console.log(chalk`Deploy cloud code to app: {green ${argv.context.app}}`);
  const cloudCodeMap = argv.appConfig.cloudCode || {};
  Object.keys(cloudCodeMap).map((cloudCodeName) => {
    console.log(chalk`Deploying cloud code: {green ${cloudCodeName}}`);
    const cloudCode = cloudCodeMap[cloudCodeName];
    archiveSrc(cloudCode.src).then(() => {
      console.log('Archive created');
      return getChecksum();
    }).then((checksum: Checksum) => {
      console.log(`Archive checksum md5: ${checksum.md5}`);
      console.log(`Archive checksum sha256: ${checksum.sha256}`);
    });
  });
  return Promise.resolve();
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
