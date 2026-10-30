#!/usr/bin/env node
const fs = require('node:fs');
const path = require('node:path');
const cp = require('node:child_process');
const root = path.join(__dirname, '..');
const files = ['index.js', 'main.js', 'settings.js', 'config.js'];
for (const dir of ['commands', 'lib', 'scripts']) files.push(...fs.readdirSync(path.join(root, dir)).filter(f => f.endsWith('.js') || f.endsWith('.cjs')).map(f => dir + '/' + f));
let errors = 0;
for (const file of files) {
  const result = cp.spawnSync(process.execPath, ['--check', path.join(root, file)], { encoding: 'utf8' });
  if (result.status) { console.error(file, result.stderr); errors++; }
}
try {
  const main = require('../main');
  if (!main.handleMessages || !main.handleGroupParticipantUpdate || !main.handleStatus) throw new Error('Missing handlers');
} catch (error) { console.error(error.stack); errors++; }
console.log(`فحص ${files.length} ملفًا: ${errors ? `${errors} خطأ` : 'جميعها سليمة ✅'}`);
process.exit(errors ? 1 : 0);
