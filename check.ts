import * as fs from 'fs';
const text = fs.readFileSync('HRL_ACADEMY_BIBLE.md', 'utf8');
const words = text.split(/\s+/).length;
console.log(`Word count: ${words}`);
console.log(`Character count: ${text.length}`);
