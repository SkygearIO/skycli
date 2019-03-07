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
'use strict';

require('@babel/polyfill');
const config = require('./dist/config');
const configUtil = require('./dist/config-util');

function checkArguments(argv, options) {
  // Populate some data from argv for convenience
  argv.currentEnvironment = configUtil.currentEnvironment(argv);
  argv.currentAccount = configUtil.currentAccount(argv);

  // Print argv for debug mode to facilitate debugging.
  if (argv.debug) {
    console.log('argv: ', argv);
  }
  return true;
}

const cli = require('yargs')
  .commandDir('dist/commands')
  .demandCommand()
  .pkgConf('skycli', __dirname)
  .config(config.loadGlobal())
  .config({
    project: config.loadProject(),
  })
  .env('SKYCLI')
  .option('debug', {
    type: 'boolean',
    desc: 'Show debug logs',
  })
  .option('verbose', {
    type: 'boolean',
    desc: 'Show verbose logs',
  })
  .option('environment', {
    type: 'string',
    desc: config.developerMode && 'Set controller environment.',
  })
  .check(checkArguments)
  .help();

module.exports = cli;
