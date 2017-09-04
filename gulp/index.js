var requireDir = require('require-dir');

// Initialize the babel transpiler so ES2015 files gets compiled
// when they're loaded
require('babel-core/register');

// Require all tasks in tasks, including subfolders
requireDir('./tasks', { recurse: true });
