import chalk from "chalk";
import inquirer from "inquirer";

import * as config from "../../config";
import { createGlobalConfig } from "../../configUtil";
import { Arguments, createCommand } from "../../util";
import { cliContainer } from "../../container";

interface ClusterOption {
  name: string;
  apiKey: string;
  endpoint: string;
  debug: boolean;
}

const clusterOptions: ClusterOption[] = [
  {
    name: "skygeario",
    apiKey: "da0a05897b92ae954e281c31f95e5ce8",
    endpoint: "https://controller.skygear.dev",
    debug: false,
  },
  {
    name: "skygeario staging",
    apiKey: "61fc82a7fa9cd4ba1a28bd1111df86e0",
    endpoint: "https://controller.staging.skygear.dev",
    debug: true,
  },
  {
    name: "skygeario dev",
    apiKey: "3ac91f63e599eafce8632420613754cb",
    endpoint: "https://controller.dev.skygearapis.com",
    debug: true,
  },
  {
    name: "Connect to my own cluster",
    apiKey: "",
    endpoint: "",
    debug: false,
  },
];

const apiKeyPrompt: inquirer.Question = {
  message: "Cluster API key:",
  name: "apiKey",
  type: "input",
  validate: input => {
    if (input.trim() === "") {
      return "Cluster API key is required.";
    }
    return true;
  },
};

const urlPrompt: inquirer.Question = {
  message: "Cluster endpoint:",
  name: "endpoint",
  type: "input",
  validate: input => {
    if (input.trim() === "") {
      return "Cluster API endpoint is required.";
    }
    return true;
  },
};

async function selectCluster(argv: Arguments) {
  const answers = await inquirer.prompt([
    {
      choices: clusterOptions
        .filter(o => !o.debug || argv.debug)
        .map(t => ({ name: t.name, value: t })),
      message: "Select a cluster you want to connect to:",
      name: "cluster",
      type: "list",
    },
  ]);
  return answers.cluster;
}

async function askClusterServer(argv: Arguments) {
  const prompts = [];
  const server = {
    apiKey: argv["api-key"] as string,
    endpoint: argv.endpoint as string,
  };

  if (!server.endpoint && !server.apiKey) {
    const selected = await selectCluster(argv);
    server.apiKey = selected.apiKey;
    server.endpoint = selected.endpoint;
  }

  if (server.endpoint) {
    console.log(
      chalk`Setup cluster API endpoint as {green ${server.endpoint}}.`
    );
  } else {
    prompts.push(urlPrompt);
  }

  if (server.apiKey) {
    console.log(chalk`Setup cluster API key as {green ${server.apiKey}}.`);
  } else {
    prompts.push(apiKeyPrompt);
  }

  if (prompts.length === 0) {
    return Promise.resolve(server);
  }

  return inquirer.prompt(prompts).then(answers => {
    return {
      ...server,
      ...answers,
    };
  });
}

async function run(argv: Arguments) {
  const { endpoint, apiKey } = await askClusterServer(argv);

  await cliContainer.container.configure({
    endpoint,
    apiKey,
  });

  const env = await cliContainer.getClusterEnv();
  const newGlobalConfig = createGlobalConfig();
  const currentContextKey = newGlobalConfig.current_context;
  const currentClusterKey = newGlobalConfig.context[currentContextKey].cluster;
  newGlobalConfig.cluster[currentClusterKey] = {
    endpoint: endpoint,
    api_key: apiKey,
    env: env,
  };
  config.save(newGlobalConfig, config.ConfigDomain.GlobalDomain);
  console.log(chalk`Connected to Skygear cluster at {green ${endpoint}}.`);
}

export default createCommand({
  builder: yargs => {
    return yargs
      .option("endpoint", {
        desc: "Cluster API endpoint.",
        type: "string",
      })
      .option("api-key", {
        desc: "Cluster API key.",
        type: "string",
      });
  },
  command: "set-cluster",
  describe: "Connect to Skygear cluster",
  handler: run,
});
