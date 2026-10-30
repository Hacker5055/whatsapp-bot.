const fs = require('node:fs');
const path = require('node:path');
const root = path.resolve(__dirname, '..');
for (const name of ['temp', 'tmp']) {
  const dir = path.join(root, name);
  if (!fs.existsSync(dir)) continue;
  for (const entry of fs.readdirSync(dir)) {
    const file = path.join(dir, entry);
    try { fs.rmSync(file, { recursive: true, force: true }); } catch (error) { console.error('تعذر مسح ملف مؤقت:', error.message); }
  }
}
console.log('✅ تم تنظيف الملفات المؤقتة فقط؛ الجلسة والإعدادات لم تُمس.');
