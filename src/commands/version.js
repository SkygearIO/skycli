var pkg = require('../../package.json');

function printVersion() {
  console.log(pkg.version);
}

module.exports = {
  command: 'version',
  desc: 'Print version',
  handler: printVersion
};
