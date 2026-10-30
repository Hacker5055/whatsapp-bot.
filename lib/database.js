const { Pool } = require('pg');
const { createCipheriv, createDecipheriv, randomBytes } = require('node:crypto');

let pool;
let namespace = 'black-x';
let encryptionKey;
const local = { rejectUnauthorized: process.env.DATABASE_SSL_REJECT_UNAUTHORIZED === 'true' };

function sessionKey() {
  const raw = String(process.env.SESSION_ENCRYPTION_KEY || '').trim();
  if (/^[a-f\d]{64}$/i.test(raw)) return Buffer.from(raw, 'hex');
  try {
    const key = Buffer.from(raw, 'base64');
    if (key.length === 32) return key;
  } catch {}
  throw new Error('مفتاح SESSION_ENCRYPTION_KEY لازم يكون 32 بايت بصيغة base64 أو 64 رقم hex. نفّذ npm run session:key.');
}

async function initDatabase() {
  if (!process.env.DATABASE_URL) {
    if (process.env.DYNO) throw new Error('تشغيل Heroku يحتاج DATABASE_URL لحفظ جلسة واتساب والإعدادات. راجع دليل Heroku.');
    return false;
  }
  if (pool) return true;
  encryptionKey = sessionKey();
  namespace = String(process.env.SESSION_ID || 'black-x');
  if (!/^[a-zA-Z0-9_-]{1,64}$/.test(namespace)) throw new Error('SESSION_ID يقبل الحروف الإنجليزية والأرقام و _ و - فقط، بحد أقصى 64 حرف.');
  pool = new Pool({ connectionString: process.env.DATABASE_URL, ssl: process.env.DATABASE_SSL === 'false' ? false : local, max: 5, connectionTimeoutMillis: 15000 });
  pool.on('error', () => console.error('❌ تعذر الاتصال بقاعدة البيانات. تحقق من DATABASE_URL.'));
  await pool.query(`
    CREATE TABLE IF NOT EXISTS blackx_auth (namespace TEXT NOT NULL, key TEXT NOT NULL, value TEXT NOT NULL, PRIMARY KEY(namespace, key));
    CREATE TABLE IF NOT EXISTS blackx_state (namespace TEXT NOT NULL, key TEXT NOT NULL, value JSONB NOT NULL, PRIMARY KEY(namespace, key));
    CREATE TABLE IF NOT EXISTS blackx_locks (namespace TEXT PRIMARY KEY, token TEXT NOT NULL, expires_at BIGINT NOT NULL);
  `);
  return true;
}

function seal(value) {
  if (!encryptionKey) throw new Error('Database is not initialized');
  const iv = randomBytes(12);
  const cipher = createCipheriv('aes-256-gcm', encryptionKey, iv);
  cipher.setAAD(Buffer.from(namespace));
  const encrypted = Buffer.concat([cipher.update(JSON.stringify(value), 'utf8'), cipher.final()]);
  return ['v1', iv.toString('base64'), cipher.getAuthTag().toString('base64'), encrypted.toString('base64')].join('.');
}

function open(value) {
  const [version, iv, tag, encrypted] = String(value).split('.');
  if (version !== 'v1' || !iv || !tag || !encrypted) throw new Error('صيغة الجلسة المحفوظة غير صالحة.');
  const decipher = createDecipheriv('aes-256-gcm', encryptionKey, Buffer.from(iv, 'base64'));
  decipher.setAAD(Buffer.from(namespace));
  decipher.setAuthTag(Buffer.from(tag, 'base64'));
  return JSON.parse(Buffer.concat([decipher.update(Buffer.from(encrypted, 'base64')), decipher.final()]).toString('utf8'));
}

async function acquireLock(ttlMs = 90000) {
  if (!pool) return { release: async () => {}, renew: async () => {}, remote: false };
  const token = randomBytes(24).toString('hex');
  const now = Date.now();
  const result = await pool.query(`
    INSERT INTO blackx_locks(namespace, token, expires_at) VALUES($1, $2, $3)
    ON CONFLICT(namespace) DO UPDATE SET token=EXCLUDED.token, expires_at=EXCLUDED.expires_at
    WHERE blackx_locks.expires_at < $4
    RETURNING token`, [namespace, token, now + ttlMs, now]);
  if (!result.rowCount) throw new Error('SESSION_BUSY: توجد نسخة أخرى تستخدم الجلسة. شغّل worker واحد فقط لنفس SESSION_ID.');
  let released = false;
  return {
    remote: true,
    async renew() {
      const renewed = await pool.query('UPDATE blackx_locks SET expires_at=$1 WHERE namespace=$2 AND token=$3', [Date.now() + ttlMs, namespace, token]);
      if (!renewed.rowCount && !released) throw new Error('SESSION_BUSY: فقدت النسخة قفل الجلسة.');
    },
    async release() {
      if (released) return;
      released = true;
      await pool.query('DELETE FROM blackx_locks WHERE namespace=$1 AND token=$2', [namespace, token]);
    }
  };
}

function __testInitKey(raw) { if (process.env.NODE_ENV !== 'test') throw new Error('test only'); process.env.SESSION_ENCRYPTION_KEY = raw; encryptionKey = sessionKey(); }
function getPool() { return pool; }
function getNamespace() { return namespace; }
async function closeDatabase() { if (pool) { const old = pool; pool = undefined; await old.end(); } }
module.exports = { initDatabase, getPool, getNamespace, seal, open, acquireLock, closeDatabase, __testInitKey };
