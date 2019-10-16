import chalk from 'chalk';

import { Arguments, createCommand } from '../../util';
import { requireClusterConfig } from '../middleware';
import { askCredentials, askInvitationCode } from './util';
import { cliContainer } from '../../container';
import { JSONObject } from '@skygear/node-client';

async function run(argv: Arguments) {
  const answers = await askCredentials(argv);
  const invitationCode = await askInvitationCode();
  const metadata: JSONObject = {};
  if (invitationCode) {
    metadata['invitation_code'] = invitationCode;
  }

  await cliContainer.container.auth.signup(
    { email: answers.email },
    answers.password,
    { metadata }
  );
  console.log(chalk`Sign up as {green ${answers.email}}.`);
}

export default createCommand({
  builder: (yargs) => {
    return yargs.middleware(requireClusterConfig).option('email', {
      desc: 'Sign up with email',
      type: 'string'
    });
  },
  command: 'signup',
  describe: 'Sign up developer',
  handler: run
});
