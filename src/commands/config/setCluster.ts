import chalk from "chalk";
import inquirer from "inquirer";

import { save } from "../../config";
import { Arguments, createCommand } from "../../util";
import { cliContainer } from "../../container";
import { ClusterConfig } from "../../types";

interface ClusterOption {
  displayName: string;
  debug: boolean;
  cluster?: ClusterDef;
}

interface ClusterDef {
  name: string;
  apiKey: string;
  endpoint: string;
}

const clusterOptions: ClusterOption[] = [
  {
    displayName: "skygeario",
    debug: false,
    cluster: {
      name: "skygeario",
      apiKey: "sq3GcUp0QVRTYPwBpnLcQi3jHK7SJFfF",
      endpoint: "https://controller.skygear.dev",
    },
  },
  {
    displayName: "skygeario staging",
    debug: true,
    cluster: {
      name: "skygeario-staging",
      apiKey: "nA1nZ2vemgjJFD99n36QoGNObG5myWXO",
      endpoint: "https://controller.staging.skygear.dev",
    },
  },
  {
    displayName: "skygeario dev",
    debug: true,
    cluster: {
      name: "skygeario-dev",
      apiKey: "3ac91f63e599eafce8632420613754cb",
      endpoint: "https://controller.dev.skygearapis.com",
    },
  },
  {
    displayName: "Connect to my own cluster",
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

const namePrompt: inquirer.Question = {
  message: "Cluster Name:",
  name: "name",
  type: "input",
  validate: input => {
    if (!/^[a-zA-Z0-9-]{1,}$/.test(input)) {
      return "Cluster Name must contain only alphanumeric characters and dash.";
    }
    return true;
  },
};

async function selectCluster(argv: Arguments) {
  const answers = await inquirer.prompt([
    {
      choices: clusterOptions
        .filter(o => !o.debug || argv.debug)
        .map(t => ({ name: t.displayName, value: t.cluster })),
      message: "Select a cluster you want to connect to:",
      name: "cluster",
      type: "list",
    },
  ]);
  return answers.cluster as ClusterDef | undefined;
}

async function askClusterServer(argv: Arguments) {
  const prompts = [];
  const server: ClusterDef = {
    name: argv.cluster as string,
    endpoint: argv.endpoint as string,
    apiKey: argv["api-key"] as string,
  };
  if (!server.endpoint || !server.apiKey) {
    let selected: ClusterDef | undefined;
    if (!server.name) {
      selected = await selectCluster(argv);
      if (selected) {
        // eslint-disable-next-line require-atomic-updates
        server.name = selected.name;
      }
    } else {
      selected = clusterOptions.find(c => c.cluster?.name === server.name)
        ?.cluster;
      if (!selected) {
        const choices = clusterOptions
          .filter(o => !o.debug || argv.debug)
          .map(o => o.cluster?.name)
          .filter(n => n);
        throw new Error(
          `Cluster not found. Valid choices are: ${choices.join(", ")}`
        );
      }
    }

    if (selected) {
      if (!server.endpoint) {
        // eslint-disable-next-line require-atomic-updates
        server.endpoint = selected.endpoint;
      }
      if (!server.apiKey) {
        // eslint-disable-next-line require-atomic-updates
        server.apiKey = selected.apiKey;
      }
    }
  }

  if (!server.name) {
    prompts.push(namePrompt);
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
  const { endpoint, apiKey, name: clusterName } = await askClusterServer(argv);

  await cliContainer.container.configure({
    endpoint,
    apiKey,
  });
  const { env } = await cliContainer.getClusterConfig();

  const config = argv.context.skycliConfig!;
  config.clusters = config.clusters ?? [];
  config.contexts = config.contexts ?? [];

  const clusterConfig: ClusterConfig = { env, endpoint, api_key: apiKey };
  const cluster = config.clusters.find(c => c.name === clusterName);
  if (!cluster) {
    config.clusters.push({ name: clusterName, cluster: clusterConfig });
  } else {
    cluster.cluster = clusterConfig;
  }

  const context = config.contexts.find(c => c.context.cluster === clusterName);
  if (!context) {
    config.contexts.push({
      name: clusterName,
      context: { cluster: clusterName, user: clusterName },
    });
  } else {
    context.context.cluster = clusterName;
  }

  config.current_context = clusterName;
  console.log(chalk`Current context set to {green ${clusterName}}.`);
  save(config, "global");

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
        desc: "Cluster type.",
        type: "string",
      });
  },
  command: "set-cluster",
  describe: "Connect to Skygear cluster",
  handler: run,
});
