const fs = require('node:fs');
const path = require('node:path');
const { getPool, getNamespace } = require('./database');
const root = path.resolve(__dirname, '..');
const dataDir = path.join(root, 'data');
const pending = new Map();
let writeError = null;

async function hydrate() {
  fs.mkdirSync(dataDir, { recursive: true });
  const pool = getPool();
  let storedKeys = new Set();
  if (pool) {
    const { rows } = await pool.query('SELECT key,value FROM blackx_state WHERE namespace=$1', [getNamespace()]);
    storedKeys = new Set(rows.map(row => row.key));
    for (const row of rows) {
      if (!/^[a-zA-Z0-9_.-]+$/.test(row.key)) continue;
      fs.writeFileSync(path.join(dataDir, row.key), JSON.stringify(row.value, null, 2));
    }
  }
  const settings = require('../settings');
  const modeFile = path.join(dataDir, 'messageCount.json');
  if (!fs.existsSync(modeFile) || (pool && !storedKeys.has('messageCount.json'))) fs.writeFileSync(modeFile, JSON.stringify({ isPublic: settings.commandMode === 'public' }));
  // Owner authorization comes from the private environment, never upstream data.
  fs.writeFileSync(path.join(dataDir, 'owner.json'), JSON.stringify(settings.ownerNumbers));
}

function persist(file, contents) {
  const target = path.resolve(file);
  if (!target.startsWith(dataDir + path.sep)) return false;
  fs.mkdirSync(path.dirname(target), { recursive: true });
  const temp = target + '.tmp';
  fs.writeFileSync(temp, contents);
  fs.renameSync(temp, target);
  const pool = getPool();
  if (!pool) return true;
  const key = path.basename(target);
  let value;
  try { value = JSON.parse(String(contents)); }
  catch { throw new Error('ملف الإعدادات ليس JSON صالحًا: ' + key); }
  const previous = pending.get(key)?.promise || Promise.resolve();
  const promise = previous.catch(() => {}).then(() => pool.query(`
    INSERT INTO blackx_state(namespace,key,value) VALUES($1,$2,$3::jsonb)
    ON CONFLICT(namespace,key) DO UPDATE SET value=EXCLUDED.value`, [getNamespace(), key, JSON.stringify(value)]))
    .then(() => { writeError = null; })
    .catch(() => {
      writeError = new Error('تعذر حفظ الإعدادات في قاعدة البيانات؛ لن نؤكد نجاح التغيير.');
      console.error('❌ ' + writeError.message);
      throw writeError;
    });
  pending.set(key, { promise, value });
  // The caller is synchronous (upstream API). Observe errors immediately and
  // require a successful flush before sending a success reply.
  promise.catch(() => {});
  return true;
}

async function flush() {
  await Promise.all([...pending.values()].map(item => item.promise));
  if (writeError) throw writeError;
}
module.exports = { hydrate, persist, flush, dataDir };
