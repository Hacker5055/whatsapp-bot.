// Per-group fail-closed outbound silence. State survives Heroku dyno restarts.
const fs = require('node:fs');
const path = require('node:path');
const state = require('./state-store');
const file = path.join(state.dataDir, 'silent-groups.json');
let silent = new Set();
let configured = new Set();

function load() {
  const raw = (process.env.SILENT_GROUP_IDS || '').trim();
  const ids = raw ? raw.split(/[\s,]+/) : [];
  if (ids.some(id => !/^[0-9-]+@g\.us$/.test(id))) throw new Error('SILENT_GROUP_IDS: معرّف المجموعة غير صالح؛ لن يبدأ البوت حتى تصححه.');
  configured = new Set(ids);
  try {
    const ids = JSON.parse(fs.readFileSync(file, 'utf8'));
    silent = new Set(Array.isArray(ids) ? ids.filter(id => typeof id === 'string' && id.endsWith('@g.us')) : []);
  } catch (error) {
    if (error.code !== 'ENOENT') throw error; // do not start with a broken denylist
    silent = new Set();
  }
}
function isSilent(jid) { return typeof jid === 'string' && (silent.has(jid) || configured.has(jid)); }
async function setSilent(jid, enabled) {
  if (!jid?.endsWith('@g.us')) throw new Error('الصمت متاح للمجموعات فقط');
  // Enable before persisting so concurrent replies cannot leak to the group.
  if (enabled) silent.add(jid);
  const next = new Set(silent);
  if (!enabled) next.delete(jid);
  state.persist(file, JSON.stringify([...next]));
  await state.flush();
  silent = next;
}
function protect(sock) {
  const send = sock.sendMessage.bind(sock);
  sock.sendMessage = (jid, ...args) => isSilent(jid) ? Promise.resolve(undefined) : send(jid, ...args);
}
module.exports = { load, isSilent, setSilent, protect };
