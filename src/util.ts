/**
 * Copyright 2017 Oursky Ltd.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */
import moment from 'moment';
import { Arguments as YargsArguments, Argv } from 'yargs';
import { AppConfig, CLIContext, GlobalConfig } from './types';
import { printError } from './error';
import { cliContainer } from './container';
import Table, { HorizontalTable } from 'cli-table3';

export interface Arguments extends YargsArguments {
  debug: boolean;
  verbose: boolean;
  environment: string;
  context: CLIContext;
  globalConfig: GlobalConfig;
  appConfig: AppConfig;
}

// Ideally we should extend yargs's CommandModule
// but we have our own Arguments which is
// incompatiable with xargs's Arguments
// so we have to give up.
export interface CommandModule {
  describe?: string;
  command?: string[] | string;
  builder?: (yargs: Argv) => Argv;
  handler: (argv: Arguments) => Promise<void>;

  execute: (argv: Arguments) => Promise<void>;
}

export function createCommand(
  module: Pick<CommandModule, Exclude<keyof CommandModule, 'execute'>>
) {
  return Object.assign({}, module, {
    execute: module.handler,
    handler: (argv: Arguments) => {
      // Handle both sync and async error
      const clusterConfig = argv.context && argv.context.cluster;
      cliContainer.container
        .configure({
          endpoint: (clusterConfig && clusterConfig.endpoint) || '',
          apiKey: (clusterConfig && clusterConfig.api_key) || ''
        })
        .then(() => {
          return module.handler(argv);
        })
        .catch((e) => {
          printError(e);
          process.exit(1);
        });
    }
  });
}

export function executeCommand(module: CommandModule, argv: Arguments) {
  return module.execute(argv);
}

export function getCommandGroupHelpMessage(
  command: string,
  subCommands: CommandModule[]
) {
  const cmdsText = subCommands
    .map((cmd) => {
      if (typeof cmd.command === 'string') {
        return cmd.command.split(' ');
      } else if (cmd.command == null) {
        return [''];
      }
      return cmd.command;
    })
    .map((cmd) => cmd[0])
    .join(' | ');
  return `Usage: skycli ${command} [action]
  action maybe           ${cmdsText}

For detailed information on this command and its flags, run:
  skycli ${command} help`;
}

export function displayDate(date: Date): string {
  return date && moment(date).format('YYYY-MM-DD HH:mm:ss Z');
}

export function createTable(
  options?: Table.TableConstructorOptions
): HorizontalTable {
  return new Table({
    chars: {
      top: '',
      'top-mid': '',
      'top-left': '',
      'top-right': '',
      bottom: '',
      'bottom-mid': '',
      'bottom-left': '',
      'bottom-right': '',
      left: '',
      'left-mid': '',
      mid: '',
      'mid-mid': '',
      right: '',
      'right-mid': '',
      middle: ' '
    },
    style: { 'padding-left': 0, 'padding-right': 2, head: [] },
    ...options
  }) as HorizontalTable;
}
