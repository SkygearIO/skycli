import chalk from 'chalk';
import os from 'os';
import path from 'path';
import tar from 'tar';
import { isArray } from 'util';

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

function run(argv: Arguments) {
  console.log(chalk`Deploy cloud code to app: {green ${argv.context.app}}`);
  const cloudCodeMap = argv.appConfig.cloudCode || {};
  Object.keys(cloudCodeMap).map((cloudCodeName) => {
    console.log(chalk`Deploying cloud code: {green ${cloudCodeName}}`);
    const cloudCode = cloudCodeMap[cloudCodeName];
    archiveSrc(cloudCode.src).then(() => {
      console.log('Archive created');
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
