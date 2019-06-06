import { walk, skyignore, dockerignore } from './ignore';

test('walk', async () => {
  const paths = await walk('fixture/walk');
  paths.sort();
  const expected = ['src/api/index.js', 'src/index.js', 'src/lindex.js'];
  expect(expected).toEqual(paths);
});

test('skyignore', async () => {
  const paths = await skyignore('fixture/skyignore');
  paths.sort();
  const expected = [
    '.skyignore',
    'included-directory/included-file',
    'included-file'
  ];
  expect(expected).toEqual(paths);
});

test('dockerignore', async () => {
  const paths = await dockerignore('fixture/dockerignore');
  paths.sort();
  const expected = ['.dockerignore', 'src/main.go'];
  expect(expected).toEqual(paths);
});
