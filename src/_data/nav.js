// src/_data/nav.js
import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, resolve } from 'path';
import site from './site.js';

const __dirname = dirname(fileURLToPath(import.meta.url));
const filePath = resolve(__dirname, './navdata.json');
const navData = JSON.parse(readFileSync(filePath, 'utf-8'));

export default {
  nav_items: navData.nav_items.filter(item => {
    if (item.title === 'News' && !site.featureFlags.news) return false;
    if (item.title === 'Music' && !site.featureFlags.music) return false;
    return true;
  }),
};