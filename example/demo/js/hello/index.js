const _ = require('lodash');

module.exports = async function () {
  return {
    status: 200,
    body: `Hello world: ${_.random(false)}\n`
  };
}
