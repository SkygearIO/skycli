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
import chalk from 'chalk';
import fs from 'fs-extra';
import inquirer from 'inquirer';
import _ from 'lodash';
import path from 'path';

import { controller } from '../api';
import * as config from '../config';
import * as template from '../template';
import { Arguments, createCommand } from '../util';
import LoginCommand from './login';

function ensureLoggedIn(argv: Arguments) {
  if (!argv.currentAccount) {
    console.log(chalk.yellow('Requires authentication, please login.'));
    return LoginCommand.execute(argv);
  }
  return Promise.resolve();
}

function confirmProjectDirectory(argv: Arguments, projectDir: string) {
  return inquirer.prompt([
    {
      type: 'confirm',
      name: 'proceed',
      message:
        "You're about to initialze a Skygear Project in this " +
        `directory: ${projectDir}.\n` +
        'Confirm?'
    }
  ]);
}

function askProjectInfo(argv: Arguments) {
  const suggestedApp = path.basename(argv.dest);
  const token = argv.currentAccount.token;
  return inquirer.prompt([
    {
      type: 'list',
      name: 'app',
      message: 'Select an app to associate with the directory:',
      when: () => {
        console.log('Fetching the list of your apps...');
        return true;
      },
      default: suggestedApp,
      choices: () => {
        return controller.apps(token).then((apps) => {
          if (apps.length === 0) {
            return Promise.reject(
              'There are no apps in your account ' +
                `${argv.currentAccount.email}. ` +
                `Create an app at ${argv.currentEnvironment.portalURL}.`
            );
          }

          return _.reduce(
            apps,
            (result, app) => {
              result.push(app.id);
              return result;
            },
            []
          );
        });
      }
    },
    {
      type: 'confirm',
      name: 'staticHosting',
      message:
        'Do you want to create your static hosting directory ' + '(public)?'
    },
    {
      type: 'list',
      name: 'projectTemplate',
      message: 'Select the Project Template:',
      choices: [
        {
          name: 'JavaScript',
          value: 'javascript'
        },
        {
          name: 'Python',
          value: 'python'
        },
        {
          name: 'Empty',
          value: 'empty'
        }
      ]
    }
  ]);
}

function run(argv: Arguments) {
  const projectDir = path.resolve(argv.dest);

  return ensureLoggedIn(argv)
    .then(() => {
      return confirmProjectDirectory(argv, projectDir);
    })
    .then((answers) => {
      if (!answers.proceed) {
        return Promise.reject(undefined);
      }

      return askProjectInfo(argv);
    })
    .then((answers) => {
      if (argv.debug) {
        console.log('Got answers: ', answers);
      }

      // Ensure project directory exists and chdir to it.
      fs.ensureDirSync(projectDir);
      process.chdir(projectDir);

      // Run templates.
      template.cloudcode(answers.projectTemplate);
      if (answers.staticHosting) {
        const staticHostingDir = path.join(path.resolve('.'), 'public_html');
        fs.ensureDirSync(staticHostingDir);
        template.html(staticHostingDir);
      }

      // Write project config.
      console.log('Writing configuration to skygear.json');
      config.setProject('app', answers.app);

      console.log('Initialization Completed!');
    });
}

export default createCommand({
  command: 'init [dest]',
  describe: 'Initialize a Skygear project',
  builder: (yargs) => {
    return yargs.default('dest', '.');
  },
  handler: run
});
