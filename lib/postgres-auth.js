const { initAuthCreds, BufferJSON, proto } = require('@whiskeysockets/baileys');
const { getPool, getNamespace, seal, open } = require('./database');
const lidCache = require('./lid-cache');

// Signal authentication state compatible with Baileys. All values, including
// credentials and LID mappings, are encrypted before leaving this process.
async function usePostgresAuthState(pool = getPool(), ns = getNamespace()) {
  if (!pool) throw new Error('يجب تهيئة قاعدة البيانات قبل تحميل الجلسة.');
  const write = async (key, value) => {
    if (value == null) {
      await pool.query('DELETE FROM blackx_auth WHERE namespace=$1 AND key=$2', [ns, key]);
    } else {
      const encrypted = seal(JSON.stringify(value, BufferJSON.replacer));
      await pool.query(`INSERT INTO blackx_auth(namespace,key,value) VALUES($1,$2,$3)
        ON CONFLICT(namespace,key) DO UPDATE SET value=EXCLUDED.value`, [ns, key, encrypted]);
    }
  };
  const read = async (key) => {
    const { rows } = await pool.query('SELECT value FROM blackx_auth WHERE namespace=$1 AND key=$2', [ns, key]);
    if (!rows.length) return null;
    return JSON.parse(open(rows[0].value), BufferJSON.reviver);
  };
  const creds = (await read('creds')) || initAuthCreds();
  return {
    state: {
      creds,
      keys: {
        async get(type, ids) {
          if (!ids.length) return {};
          const { rows } = await pool.query('SELECT key,value FROM blackx_auth WHERE namespace=$1 AND key=ANY($2)', [ns, ids.map(id => `${type}:${id}`)]);
          const result = {};
          for (const row of rows) {
            let value = JSON.parse(open(row.value), BufferJSON.reviver);
            if (type === 'app-state-sync-key' && value) value = proto.Message.AppStateSyncKeyData.fromObject(value);
            const id = row.key.slice(type.length + 1);
            lidCache.remember(type, id, value);
            result[id] = value;
          }
          return result;
        },
        async set(data) {
          // Serialize writes so a delayed request cannot restore an older key.
          for (const [type, values] of Object.entries(data)) {
            for (const [id, value] of Object.entries(values)) {
              await write(`${type}:${id}`, value);
              lidCache.remember(type, id, value);
            }
          }
        },
        async clear() { await pool.query('DELETE FROM blackx_auth WHERE namespace=$1', [ns]); }
      }
    },
    saveCreds: () => write('creds', creds)
  };
}
module.exports = { usePostgresAuthState };
