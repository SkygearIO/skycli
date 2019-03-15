import chalk from 'chalk';
import inquirer from 'inquirer';

import { controller } from '../../api';
import * as config from '../../config';
import { createGlobalConfig } from '../../types';
import { Arguments, createCommand } from '../../util';

const apiKeyPrompt: inquirer.Question = {
  message: 'Cluster api key:',
  name: 'apiKey',
  type: 'input',
  validate: (input) => {
    if (input.trim() === '') {
      return 'Cluster api key is required.';
    }
    return true;
  }
};

const urlPrompt: inquirer.Question = {
  message: 'Cluster server endpoint:',
  name: 'endpoint',
  type: 'input',
  validate: (input) => {
    if (input.trim() === '') {
      return 'Cluster server endpoint is required.';
    }
    return true;
  }
};

function askClusterServer(argv: Arguments) {
  const prompts = [];
  const clusterConfig = argv.config.cluster;
  const server = {
    apiKey: argv['api-key'] || (clusterConfig && clusterConfig.apiKey),
    endpoint: argv.endpoint || (clusterConfig && clusterConfig.endpoint),
  };

  if (server.endpoint) {
    console.log(chalk`Setup cluster server endpoint as {green ${server.endpoint}}.`);
  } else {
    prompts.push(urlPrompt);
  }

  if (server.apiKey) {
    console.log(chalk`Setup cluster api key as {green ${server.apiKey}}.`);
  } else {
    prompts.push(apiKeyPrompt);
  }

  if (prompts.length === 0) {
    return Promise.resolve(server);
  }

  return inquirer.prompt(prompts).then((answers) => {
    return {
      ...server,
      ...answers
    };
  });
}

function run(argv: Arguments) {
  let endpoint: string;
  let apiKey: string;

  return askClusterServer(argv)
    .then((answers) => {
      endpoint = answers.endpoint;
      apiKey = answers.apiKey;
      return controller.getConfig(endpoint, apiKey);
    }).then((payload) => {
      payload.endpoint = endpoint;
      payload.apiKey = apiKey;
      const newGlobalConfig = createGlobalConfig(payload);
      config.save(newGlobalConfig, config.ConfigDomain.GlobalDomain);
      console.log(chalk`Running Skygear cluster at {green ${endpoint}}.`);
    }).catch ((error) => {
      return Promise.reject('Fail to fetch cluster config. ' + error);
    });
}

export default createCommand({
  builder: (yargs) => {
    return yargs
      .option('endpoint', {
        desc: 'Cluster controller api endpoint.',
        type: 'string'
      })
      .option('api-key', {
        desc: 'Cluster controller api key.',
        type: 'string'
      });
  },
  command: 'set-cluster-server',
  describe: 'Setup cluster endpoint url',
  handler: run
});
