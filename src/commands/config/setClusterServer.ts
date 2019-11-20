import chalk from "chalk";
import inquirer from "inquirer";

import * as config from "../../config";
import { createGlobalConfig } from "../../configUtil";
import { Arguments, createCommand } from "../../util";
import { cliContainer } from "../../container";

interface ClusterOption {
  id: string;
  name: string;
  apiKey: string;
  endpoint: string;
  debug: boolean;
}

const clusterOptions: ClusterOption[] = [
  {
    id: "skygeario",
    name: "skygeario",
    apiKey: "sq3GcUp0QVRTYPwBpnLcQi3jHK7SJFfF",
    endpoint: "https://controller.skygear.dev",
    debug: false,
  },
  {
    id: "skygeario-staging",
    name: "skygeario staging",
    apiKey: "nA1nZ2vemgjJFD99n36QoGNObG5myWXO",
    endpoint: "https://controller.staging.skygear.dev",
    debug: true,
  },
  {
    id: "skygeario-dev",
    name: "skygeario dev",
    apiKey: "3ac91f63e599eafce8632420613754cb",
    endpoint: "https://controller.dev.skygearapis.com",
    debug: true,
  },
  {
    id: "custom",
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
    cluster: argv.cluster as string,
  };

  if (!server.endpoint && !server.apiKey) {
    let selected: ClusterOption | undefined;
    if (server.cluster) {
      selected = clusterOptions.find(obj => obj.id === server.cluster);
    } else {
      selected = await selectCluster(argv);
    }
    if (!selected) {
      throw new Error("Cluster not found");
    }

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

  if (!server.apiKey) {
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
      })
      .option("cluster", {
        desc: "Cluster type. Options: skygeario, custom.",
        type: "string",
      });
  },
  command: "set-cluster",
  describe: "Connect to Skygear cluster",
  handler: run,
});
