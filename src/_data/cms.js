import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, resolve } from 'path';

const __dirname = dirname(fileURLToPath(import.meta.url));

const pPath = resolve(__dirname, '../../cms/data/productions.json');
const productions = JSON.parse(readFileSync(pPath, 'utf-8'));
const gPath = resolve(__dirname, '../../cms/data/graphics.json');
const graphics = JSON.parse(readFileSync(gPath, 'utf-8'));
const mPath = resolve(__dirname, '../../cms/data/music.json');
const music = JSON.parse(readFileSync(mPath, 'utf-8'));
const mePath = resolve(__dirname, '../../cms/data/members.json');
const members = JSON.parse(readFileSync(mePath, 'utf-8'));
const cms = {
  productions: productions.productions,
  graphics: graphics.graphics,
  music: music.music,
  members: members.members
};

console.log("cms:prods: " + JSON.stringify(cms.productions, null, 2));

export default cms;