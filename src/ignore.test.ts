import { walk } from './ignore';

test('walk', async () => {
  const paths = await walk('fixture/walk');
  paths.sort();
  const expected = ['src/api/index.js', 'src/index.js', 'src/lindex.js'];
  expect(expected).toEqual(paths);
});
