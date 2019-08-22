import chalk from 'chalk';
import inquirer from 'inquirer';
import * as yaml from 'js-yaml';

import { controller } from '../../api';
import { Arguments, createCommand } from '../../util';
import { requireApp, requireClusterConfig, requireUser } from '../middleware';

async function updateUserConfigByEditor(
  userConfigYAML: string
): Promise<string> {
  const editor = [
    {
      type: 'editor',
      name: 'user_config',
      message: 'Edit user config.',
      default: userConfigYAML
    }
  ];

  const answers = await inquirer.prompt(editor);
  const updatedUserConfig = answers.user_config as string;
  if (updatedUserConfig === userConfigYAML) {
    throw new Error('cancelled');
  }
  return updatedUserConfig;
}

async function run(argv: Arguments) {
  try {
    const userConfig = await controller.getUserConfig(argv.context);
    const userConfigYAML = yaml.safeDump(userConfig);
    const updatedUserConfigYAML = await updateUserConfigByEditor(
      userConfigYAML
    );

    const updatedUserConfigJSON = yaml.safeLoad(updatedUserConfigYAML);

    await controller.setUserConfig(argv.context, updatedUserConfigJSON);
    console.log(chalk`{green Success!} Updated user config.`);
  } catch (err) {
    if (err.message === 'cancelled') {
      console.log('Cancelled, no changes.');
      return;
    }
    throw err;
  }
}

export default createCommand({
  builder: (yargs) => {
    return yargs
      .middleware(requireClusterConfig)
      .middleware(requireUser)
      .middleware(requireApp);
  },
  command: 'update-user-config',
  describe: 'Update current app user config',
  handler: run
});
