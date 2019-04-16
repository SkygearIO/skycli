const _ = require('lodash');

module.exports = async function (context) {
  return {
    status: 200,
    body: `Hello world: ${_.random(false)}\n`
  };
}
