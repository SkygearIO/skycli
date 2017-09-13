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

const config = require('./dist/config');

const cli = require('yargs')
  .commandDir('dist/commands')
  .demandCommand()
  .pkgConf('skycli')
  .config(config.load())
  .config(config.loadLocal())
  .config({
    project: config.loadProject()
  })
  .env('SKYCLI')
  .option('debug', {
    type: 'boolean',
    desc: 'Show debug logs'
  })
  .option('verbose', {
    type: 'boolean',
    desc: 'Show verbose logs'
  })
  .option('env', {
    type: 'string',
    desc: false // Controller environment, 'false' hide this option from help
  })
  .check((argv, options) => {
    if (argv.debug) {
      console.log('argv: ', argv);
    }
    return true;
  }, true)
  .help();

module.exports = cli;
