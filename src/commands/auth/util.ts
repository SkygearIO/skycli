import chalk from 'chalk';
import inquirer from 'inquirer';

import { Arguments } from '../../util';

const emailPrompt: inquirer.Question = {
  message: 'Email:',
  name: 'email',
  type: 'input',
  validate: (input) => {
    if (input.trim() === '') {
      return 'Email is required.';
    }
    if (input.indexOf('@') === -1) {
      return 'Email is not valid (must contains @).';
    }
    return true;
  }
};

const passwordPrompt: inquirer.Question = {
  message: 'Password:',
  name: 'password',
  type: 'password',
  validate: (input) => {
    if (input === '') {
      return 'Password is required.';
    }
    return true;
  }
};

export function askCredentials(argv: Arguments) {
  const prompts = [];
  const credentials = {
    email: argv.email as string,
    password: argv.password as string
  };

  if (credentials.email) {
    console.log(chalk`{bold Email:} {cyan ${credentials.email}}`);
  } else {
    prompts.push(emailPrompt);
  }

  prompts.push(passwordPrompt);

  return inquirer.prompt(prompts).then((answers) => {
    return {
      ...credentials,
      ...answers
    };
  });
}

export function askInvitationCode(): Promise<string> {
  return inquirer
    .prompt({
      message: 'Invitation code (Optional):',
      name: 'invitationCode',
      type: 'input',
      validate: () => {
        return true;
      }
    })
    .then((answers) => {
      return answers.invitationCode;
    });
}
