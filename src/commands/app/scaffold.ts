import chalk from 'chalk';
import fs from 'fs-extra';
import inquirer from 'inquirer';
import path from 'path';
import tar from 'tar';

import { controller } from '../../api';
import { Arguments, createCommand } from '../../util';
import { requireClusterConfig, requireUser } from '../middleware';

function selectApp(argv: Arguments) {
  if (argv.app && argv.app instanceof String) {
    return Promise.resolve({ app: argv.app });
  }

  console.log('\nFetching the list of your apps...');
  return controller
    .getApps(argv.context)
    .then((apps) => apps.map((a) => a.name))
    .then((appsName) =>
      inquirer.prompt([
        {
          choices: appsName,
          message: 'Select an app to associate with the directory:',
          name: 'app',
          type: 'list'
        }
      ])
    );
}

function selectExample(argv: Arguments) {
  console.log('\nFetching examples...');
  return controller.getExamples(argv.context).then((examples) =>
    inquirer.prompt([
      {
        choices: examples,
        message: 'Select example:',
        name: 'example',
        type: 'list'
      }
    ])
  );
}

function confirmProjectDirectory(projectDir: string) {
  return inquirer.prompt([
    {
      message:
        "You're about to initialze a Skygear Project in this " +
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

function run(argv: Arguments) {
  const projectDir = path.resolve(argv.dest as string);
  let appName: string;
  let examplePath: string;

  return confirmProjectDirectory(projectDir)
    .then((answers) => {
      if (!answers.proceed) {
        return Promise.reject('cancelled');
      }

      // ensure project folder exists
      if (!fs.existsSync(projectDir)) {
        fs.mkdirSync(projectDir);
      }

      return selectApp(argv);
    })
    .then((answers) => {
      appName = answers.app;
      return selectExample(argv);
    })
    .then((answers) => {
      // download example
      examplePath = answers.example;
      console.log('\nFetching js-example and initializing..');
      return controller.downloadExample(argv.context, examplePath);
    })
    .then((resp) => {
      // save the example to project dir
      return new Promise((resolve, reject) => {
        resp.body
          .pipe(
            tar.x({
              C: projectDir,
              strip: 1
            })
          )
          .on('error', reject)
          .on('finish', resolve);
      });
    })
    .then((_e) => {
      // update skygear.yaml with app
      const configPath = path.join(projectDir, 'skygear.yaml');
      prependFile(configPath, `app: ${appName}\n`);

      console.log(
        chalk`{green Success!} Initialized {green "${examplePath}"} template in {green "${projectDir}"}.`
      );
    })
    .catch((err) => {
      if (err === 'cancelled') {
        return Promise.resolve();
      }
      return Promise.reject('Fail to scaffold application. ' + err);
    });
}

export default createCommand({
  builder: (yargs) => {
    return yargs
      .middleware(requireClusterConfig)
      .middleware(requireUser)
      .default('dest', '.')
      .option('app', {
        desc: 'Application name',
        type: 'string'
      });
  },
  command: 'scaffold [dest]',
  describe: 'Scaffold skygear application',
  handler: run
});
