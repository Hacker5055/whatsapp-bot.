process.env.NODE_ENV = 'test';
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { normalizeCommand } = require('../lib/command-aliases');
const { arabic, cleanContent, attachLocalization } = require('../lib/localize');
const { normalizePhone } = require('../lib/phone');
const { normalizeWords, containsBadword } = require('../lib/antibadword');
const { seal, open } = require('../lib/database');
const db = require('../lib/database');
const state = require('../lib/state-store');
const { initAuthCreds } = require('@whiskeysockets/baileys');

const fakeSocket = () => {
  const sent = [];
  const sock = { user: { id: '201012345678:1@s.whatsapp.net', lid: '123@lid' }, sendMessage: async (jid, payload) => { sent.push({ jid, payload }); return {}; }, groupMetadata: async () => ({ id: 'sample@g.us', participants: [
    { id: '201012345678@s.whatsapp.net', lid: '123@lid', admin: 'admin' },
    { id: '201098765432@s.whatsapp.net', lid: '456@lid', admin: 'admin' },
    { id: '201077777777@s.whatsapp.net', lid: '789@lid', admin: null }
  ] }) };
  return { sock, sent };
};

test('Arabic commands keep message case, and translate only command options', () => {
  assert.equal(normalizeCommand('.اوامر'), '.help');
  assert.equal(normalizeCommand('.ذكاء اكتب HTML'), '.ai اكتب HTML');
  assert.equal(normalizeCommand('.منع_الروابط تعيين طرد'), '.antilink set kick');
  assert.equal(normalizeCommand('.وضع عام'), '.mode public');
  assert.equal(normalizeCommand('.ترحيب تعيين مرحباً {user} في {group}'), '.welcome set مرحباً {user} في {group}');
  assert.equal(normalizeCommand('.منع_الشتائم add كلمة'), '.antibadword add كلمة');
  assert.equal(normalizeCommand('.نطق مرحبا'), '.tts مرحبا');
  assert.equal(normalizeCommand('أهلًا'), 'أهلًا');
});

test('phone rejects invalid numbers and supports Arabic numerals', () => {
  assert.equal(normalizePhone('٢٠١٠١٢٣٤٥٦٧٨'), '201012345678');
  assert.throws(() => normalizePhone('01012345678'), /دولي/);
  assert.equal(normalizePhone(''), '');
});

test('localization changes only bot output, strips upstream channel metadata', () => {
  const result = cleanContent({ text: 'Pong!', contextInfo: { forwardedNewsletterMessageInfo: { newsletterName: 'test' }, isForwarded: true, forwardingScore: 1 } });
  assert.match(result.text, /شغال/);
  assert.equal(result.contextInfo.forwardedNewsletterMessageInfo, undefined);
  assert.equal(result.contextInfo.isForwarded, undefined);
  assert.match(arabic('❌ Failed to fetch this result. Try again later.'), /تعذر جلب/);
});

test('Arabic badword matcher respects word boundaries and diacritics', () => {
  assert.equal(normalizeWords('أَهلاً'), 'اهلا');
  assert.equal(containsBadword('سِمْسِم', ['سمسم']), true);
  assert.equal(containsBadword('سيمسم', ['سمسم']), false);
  assert.equal(containsBadword('سجل معنا', ['جل']), false);
});

test('encrypted session values roundtrip and reject corrupted data', () => {
  process.env.DATABASE_URL = '';
  process.env.SESSION_ENCRYPTION_KEY = Buffer.alloc(32, 7).toString('base64');
  // initDatabase without a URL is intentionally local; use the module test hook.
  db.__testInitKey(process.env.SESSION_ENCRYPTION_KEY);
  const encrypted = seal({ creds: initAuthCreds(), key: Buffer.from('hello') });
  assert.match(encrypted, /^v1\./);
  assert.doesNotMatch(encrypted, /hello/);
  assert.ok(open(encrypted).creds);
  assert.throws(() => open(encrypted.slice(0, -8) + 'xxxxxxxx')); 
});

test('data adapter isolates state files from ephemeral files', async () => {
  const adapter = require('../lib/data-fs');
  const file = path.join(__dirname, '../data/test-local.json');
  adapter.writeFileSync(file, JSON.stringify({ enabled: true }));
  assert.deepEqual(JSON.parse(fs.readFileSync(file)), { enabled: true });
  await state.flush();
  fs.unlinkSync(file);
});

test('dispatches Arabic help, blocks non-owner in private mode, and keeps menu Arabic', async () => {
  const { sock, sent } = fakeSocket();
  attachLocalization(sock);
  const handler = require('../main').handleMessages;
  const message = (text, fromMe, id) => ({ key: { remoteJid: fromMe ? '201012345678@s.whatsapp.net' : '201077777777@s.whatsapp.net', fromMe, id }, message: { conversation: text } });
  await handler(sock, { messages: [message('.اوامر', false, 'x1')], type: 'notify' });
  assert.equal(sent.length, 0);
  await handler(sock, { messages: [message('.اوامر', true, 'x2')], type: 'notify' });
  assert.ok(sent.some(m => /أوامر|بوت واتساب عربي/.test(m.payload.caption || m.payload.text || '')));
});

test('admin guards block members and allow Arabic moderation settings for admins', async () => {
  const { sock, sent } = fakeSocket();
  attachLocalization(sock);
  const group = 'sample@g.us';
  const original = fs.readFileSync(path.join(__dirname, '../data/userGroupData.json'));
  const handle = require('../main').handleMessages;
  const incoming = (sender, text, id) => ({ messages: [{ key: { remoteJid: group, participant: sender, fromMe: false, id }, message: { conversation: text } }], type: 'notify' });
  try {
    // In private mode group moderation is intentionally still available for admins only after owner switches to public.
    const mode = path.join(__dirname, '../data/messageCount.json');
    const previousMode = fs.readFileSync(mode);
    fs.writeFileSync(mode, JSON.stringify({ isPublic: true }));
    try {
      await handle(sock, incoming('201077777777@s.whatsapp.net', '.منع_الروابط تشغيل', 'group1'));
      assert.equal(sent.some(m => /تم تفعيل منع الروابط/.test(m.payload.text || '')), false);
      await handle(sock, incoming('201098765432@s.whatsapp.net', '.منع_الروابط تشغيل', 'group2'));
      assert.equal(JSON.parse(fs.readFileSync(path.join(__dirname, '../data/userGroupData.json'))).antilink[group].enabled, true);
      await handle(sock, incoming('201098765432@s.whatsapp.net', '.منع_الشتائم add كلمة', 'group3'));
      assert.ok(JSON.parse(fs.readFileSync(path.join(__dirname, '../data/userGroupData.json'))).antibadword[group].words.includes('كلمة'));
      await handle(sock, incoming('201098765432@s.whatsapp.net', '.منع_الروابط ايقاف', 'group4'));
      assert.equal(JSON.parse(fs.readFileSync(path.join(__dirname, '../data/userGroupData.json'))).antilink[group], undefined);
    } finally { fs.writeFileSync(mode, previousMode); }
  } finally { fs.writeFileSync(path.join(__dirname, '../data/userGroupData.json'), original); }
});

test('PostgreSQL Signal auth persists encrypted credentials and key state', async () => {
  const rows = new Map();
  const pool = { async query(sql, params) {
    if (sql.startsWith('SELECT value')) return { rows: rows.has(params[1]) ? [{ value: rows.get(params[1]) }] : [] };
    if (sql.startsWith('SELECT key,value')) return { rows: params[1].filter(key => rows.has(key)).map(key => ({ key, value: rows.get(key) })) };
    if (sql.startsWith('DELETE')) { rows.delete(params[1]); return { rowCount: 1 }; }
    if (sql.startsWith('INSERT')) { rows.set(params[1], params[2]); return { rowCount: 1 }; }
    throw new Error(sql);
  } };
  const { usePostgresAuthState } = require('../lib/postgres-auth');
  const first = await usePostgresAuthState(pool, 'black-x');
  first.state.creds.registered = true;
  await first.saveCreds();
  await first.state.keys.set({ 'pre-key': { demo: { private: Buffer.from('private key'), public: Buffer.from('public key') } } });
  assert.match(rows.get('creds'), /^v1\./);
  assert.doesNotMatch(rows.get('pre-key:demo'), /private key/);
  const next = await usePostgresAuthState(pool, 'black-x');
  assert.equal(next.state.creds.registered, true);
  const read = await next.state.keys.get('pre-key', ['demo']);
  assert.equal(Buffer.from(read.demo.private).toString(), 'private key');
  await next.state.keys.set({ 'pre-key': { demo: null } });
  assert.equal(rows.has('pre-key:demo'), false);
});

test('group silence is per-group, persistent, and blocks even direct outbound replies', async () => {
  const silence = require('../lib/group-silence');
  const file = path.join(state.dataDir, 'silent-groups.json');
  const old = fs.existsSync(file) ? fs.readFileSync(file) : null;
  const { sock, sent } = fakeSocket();
  attachLocalization(sock);
  silence.protect(sock);
  const handler = require('../main').handleMessages;
  const groupMessage = (text, id) => ({ key: { remoteJid: 'work@g.us', participant: '201012345678@s.whatsapp.net', fromMe: true, id }, message: { conversation: text } });
  try {
    silence.load();
    await handler(sock, { messages: [groupMessage('.صمت تشغيل', 's1')], type: 'notify' });
    assert.equal(silence.isSilent('work@g.us'), true);
    assert.equal(sent.length, 0);
    silence.load();
    assert.equal(silence.isSilent('work@g.us'), true);
    await handler(sock, { messages: [groupMessage('.اوامر', 's2')], type: 'notify' });
    await sock.sendMessage('work@g.us', { text: 'error fallback' });
    assert.equal(sent.length, 0);
    assert.equal(silence.isSilent('other@g.us'), false);
    await handler(sock, { messages: [groupMessage('.صمت إيقاف', 's3')], type: 'notify' });
    assert.equal(silence.isSilent('work@g.us'), false);
  } finally {
    if (old === null) fs.rmSync(file, { force: true });
    else fs.writeFileSync(file, old);
    silence.load();
  }
});

test('environment group silence applies before any command and rejects invalid IDs', () => {
  const silence = require('../lib/group-silence');
  const prior = process.env.SILENT_GROUP_IDS;
  try {
    process.env.SILENT_GROUP_IDS = '123-456@g.us,789-123@g.us';
    silence.load();
    assert.equal(silence.isSilent('123-456@g.us'), true);
    assert.equal(silence.isSilent('789-123@g.us'), true);
    assert.equal(silence.isSilent('unlisted@g.us'), false);
    process.env.SILENT_GROUP_IDS = 'bad-value';
    assert.throws(() => silence.load(), /SILENT_GROUP_IDS/);
  } finally {
    if (prior === undefined) delete process.env.SILENT_GROUP_IDS;
    else process.env.SILENT_GROUP_IDS = prior;
    silence.load();
  }
});
