import chalk from 'chalk';

import { Arguments, createCommand } from '../../util';
import { requireApp, requireClusterConfig, requireUser } from '../middleware';
import { cliContainer } from '../../container';

async function run(argv: Arguments) {
  const appName = argv.context.app || '';
  const email = argv.email as string;

  if (!email) {
    throw new Error('Email is required.');
  }

  const collaborators = await cliContainer.getCollaborators(appName);
  let userID: string | undefined;
  for (const collaborator of collaborators) {
    if (collaborator.email === email) {
      userID = collaborator.id;
      break;
    }
  }
  if (!userID) {
    throw new Error('User is not a collaborator.');
  }

  await cliContainer.removeCollaborator(appName, userID);
  console.log(chalk`{green Success!} Removed user from collaborators.`);
}

export default createCommand({
  builder: (yargs) => {
    return yargs
      .middleware(requireClusterConfig)
      .middleware(requireUser)
      .middleware(requireApp)
      .demandOption(['email'])
      .option('email', {
        type: 'string',
        describe: `User's email`
      });
  },
  command: 'remove-collaborator [email]',
  describe: 'Remove user from collaborators by email',
  handler: run
});
