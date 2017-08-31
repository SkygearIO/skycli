function call(argv) {
  console.log('init called for dir', argv.dir);
}

module.exports = {
  command: 'init [dir]',
  desc: 'Create an empty repo',
  builder: {
    dir: {
      default: '.'
    }
  },
  handler: call
};
