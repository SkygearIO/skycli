'use strict';

module.exports = require('yargs')
  .commandDir('dist/commands')
  .demandCommand()
  .help()
