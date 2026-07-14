import { readFileSync, existsSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, resolve } from 'path';

const __dirname = dirname(fileURLToPath(import.meta.url));

const generatedDir = resolve(__dirname, '../../cms/data');
const fixtureDir = resolve(__dirname, '../../tests/fixtures/cms');

// cms/data is gitignored and produced by `npm run build:content`, which needs
// Contentful credentials. Fall back to fixtures so the site still builds in CI.
const dataDir = existsSync(resolve(generatedDir, 'posts.json')) ? generatedDir : fixtureDir;

const load = (name) => JSON.parse(readFileSync(resolve(dataDir, `${name}.json`), 'utf-8'));

const cms = {
  productions: load('productions').productions,
  graphics: load('graphics').graphics,
  music: load('music').music,
  members: load('members').members,
  posts: load('posts').posts,
};

export default cms;
