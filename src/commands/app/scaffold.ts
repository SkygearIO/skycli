import chalk from 'chalk';
import fs from 'fs-extra';
import inquirer from 'inquirer';
import path from 'path';
import * as tar from 'tar-fs';

import { Arguments, createCommand } from '../../util';
import { requireClusterConfig, requireUser } from '../middleware';
import { cliContainer } from '../../container';

const gunzip = require('gunzip-maybe');

async function selectApp(argv: Arguments): Promise<string> {
  if (argv.app && typeof argv.app === 'string') {
    return argv.app;
  }

  console.log('\nFetching list of your apps...');
  const apps = await cliContainer.getApps();
  const appsName = apps.map((a) => a.name);
  const answers = await inquirer.prompt([
    {
      choices: appsName,
      message: 'Select an app to be associated with the directory:',
      name: 'app',
      type: 'list'
    }
  ]);

  return answers.app;
}

async function selectExample(): Promise<string> {
  console.log('\nFetching scaffolding templates...');
  const examples = await cliContainer.getExamples();
  const answers = await inquirer.prompt([
    {
      choices: examples,
      message: 'Select scaffolding template:',
      name: 'template',
      type: 'list'
    }
  ]);

  return answers.template;
}

function confirmProjectDirectory(projectDir: string) {
  return inquirer.prompt([
    {
      message:
        "You're about to initialze a Skygear app in this " +
        `directory: ${projectDir}\n` +
        'Confirm?',
      name: 'proceed',
      type: 'confirm'
    }
  ]);
}

function prependFile(file: string, text: string) {
  const data = fs.readFileSync(file);
  const fd = fs.openSync(file, 'w+');
  const buffer = Buffer.from(text);

  fs.writeSync(fd, buffer, 0, buffer.length, 0);
  fs.writeSync(fd, data, 0, data.length, buffer.length);
  fs.close(fd);
}

async function run(argv: Arguments) {
  const projectDir = path.resolve(argv.dest as string);

  const answers = await confirmProjectDirectory(projectDir);
  if (!answers.proceed) {
    return;
  }

  // ensure project folder exists
  if (!fs.existsSync(projectDir)) {
    fs.mkdirSync(projectDir);
  }

  const appName = await selectApp(argv);
  const examplePath = await selectExample();
  console.log('\nFetching scaffolding templates and initializing..');

  const resp = await cliContainer.downloadExample(examplePath);
  // save the example to project dir
  await new Promise((resolve, reject) => {
    resp.body
      .pipe(gunzip())
      .pipe(tar.extract(projectDir, { strip: true }))
      .on('error', reject)
      .on('finish', resolve);
  });

  // update skygear.yaml with app
  const configPath = path.join(projectDir, 'skygear.yaml');
  prependFile(configPath, `app: ${appName}\n`);
  console.log(
    chalk`{green Success!} Initialized {green "${examplePath}"} template in {green "${projectDir}"}.`
  );
}

export default createCommand({
  builder: (yargs) => {
    return yargs
      .middleware(requireClusterConfig)
      .middleware(requireUser)
      .default('dest', '.')
      .option('app', {
        desc: 'App name',
        type: 'string'
      });
  },
  command: 'scaffold [dest]',
  describe: 'Scaffold Skygear app',
  handler: run
});
