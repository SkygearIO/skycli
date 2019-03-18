import chalk from 'chalk';
import inquirer from 'inquirer';

import { controller } from '../../api';
import * as config from '../../config';
import { createGlobalConfig } from '../../types';
import { Arguments, createCommand } from '../../util';

const urlPrompt: inquirer.Question = {
  message: 'Cluster endpoint:',
  name: 'endpoint',
  type: 'input',
  validate: (input) => {
    if (input.trim() === '') {
      return 'Cluster endpoint is required.';
    }
    return true;
  }
};

function askEndpoint(argv: Arguments) {
  const prompts = [];
  const endpoint = argv.endpoint;

  if (endpoint) {
    console.log(`Setup cluster endpoint as ${endpoint}.`);
  } else {
    prompts.push(urlPrompt);
  }

  if (prompts.length === 0) {
    return Promise.resolve({endpoint});
  }

  return inquirer.prompt(prompts).then((answers) => {
    return {
      endpoint,
      ...answers
    };
  });
}

function run(argv: Arguments) {
  let endpoint: string;

  return askEndpoint(argv)
    .then((answers) => {
      endpoint = answers.endpoint;
      return controller.getConfig(endpoint);
    }).then((payload) => {
      payload.endpoint = endpoint;
      const newGlobalConfig = createGlobalConfig(payload);
      config.save(newGlobalConfig, config.ConfigDomain.GlobalDomain);
      console.log(chalk`Running Skygear cluster at {green ${endpoint}}.`);
    }). catch ((error) => {
      return Promise.reject('Fail to fetch cluster config. ' + error);
    });
}

export default createCommand({
  builder: (yargs) => {
    return yargs
      .option('endpoint', {
        alias: 'e',
        desc: 'Cluster controller api endpoint.',
        type: 'string'
      });
  },
  command: 'set-cluster-server [endpoint]',
  describe: 'Setup cluster endpoint url',
  handler: run
});
