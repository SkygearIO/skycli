import chalk from 'chalk';
import inquirer from 'inquirer';

import * as config from '../../config';
import { createGlobalConfig } from '../../types';
import { Arguments, createCommand } from '../../util';
import { cliContainer } from '../../container';

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
  const server = {
    apiKey: argv['api-key'] as string,
    endpoint: argv.endpoint as string
  };

  if (server.endpoint) {
    console.log(
      chalk`Setup cluster server endpoint as {green ${server.endpoint}}.`
    );
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

async function run(argv: Arguments) {
  const { endpoint, apiKey } = await askClusterServer(argv);

  await cliContainer.container.configure({
    endpoint,
    apiKey
  });

  const env = await cliContainer.getClusterEnv();
  const newGlobalConfig = createGlobalConfig();
  const currentContextKey = newGlobalConfig.current_context;
  const currentClusterKey = newGlobalConfig.context[currentContextKey].cluster;
  newGlobalConfig.cluster[currentClusterKey] = {
    endpoint: endpoint,
    api_key: apiKey,
    env: env
  };
  config.save(newGlobalConfig, config.ConfigDomain.GlobalDomain);
  console.log(chalk`Running Skygear cluster at {green ${endpoint}}.`);
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
