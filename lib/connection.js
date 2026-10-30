require('dotenv').config();
const fs = require('node:fs');
const pino = require('pino');
const { default: makeWASocket, useMultiFileAuthState, fetchLatestBaileysVersion, Browsers } = require('@whiskeysockets/baileys');
const { initDatabase, acquireLock, getPool } = require('./database');
const { usePostgresAuthState } = require('./postgres-auth');
const { normalizePhone } = require('./phone');

async function openConnection({ pairingNumber = '', onPairingCode = console.log } = {}) {
  await initDatabase();
  const lock = await acquireLock();
  try {
    const auth = getPool() ? await usePostgresAuthState() : await useMultiFileAuthState('./session');
    let version;
    try { ({ version } = await fetchLatestBaileysVersion()); }
    catch { console.warn('تعذر جلب أحدث إصدار واتساب؛ سيتم استخدام إصدار Baileys الافتراضي.'); }
    const sock = makeWASocket({
      ...(version ? { version } : {}),
      auth: auth.state,
      logger: pino({ level: process.env.LOG_LEVEL || 'silent' }),
      browser: Browsers.ubuntu('Chrome'),
      markOnlineOnConnect: false,
      syncFullHistory: false,
      generateHighQualityLinkPreview: false,
      defaultQueryTimeoutMs: 60000,
      connectTimeoutMs: 60000,
      keepAliveIntervalMs: 20000,
      getMessage: async () => undefined
    });
    sock.ev.on('creds.update', () => {
      Promise.resolve(auth.saveCreds()).catch(() => {
        console.error('❌ تعذر حفظ بيانات الربط. تحقق من قاعدة البيانات قبل إعادة التشغيل.');
      });
    });
    const phone = normalizePhone(pairingNumber);
    if (phone && !auth.state.creds.registered) {
      // Wait for the Noise connection before requesting a pairing code.
      await new Promise(resolve => setTimeout(resolve, 3000));
      const code = await sock.requestPairingCode(phone);
      onPairingCode(code.match(/.{1,4}/g)?.join('-') || code);
    }
    let renewing = false;
    const timer = setInterval(async () => {
      if (renewing) return;
      renewing = true;
      try { await lock.renew(); }
      catch (error) {
        console.error('❌ قفل الجلسة ضاع؛ أوقف النسخة الأخرى وشغّل worker واحدًا فقط.');
        process.exitCode = 1;
        sock.ev.emit('blackx:fatal', error);
      } finally { renewing = false; }
    }, 30000);
    timer.unref();
    let closed = false;
    const close = async ({ logout = false } = {}) => {
      if (closed) return;
      closed = true;
      clearInterval(timer);
      if (logout) {
        if (auth.state.keys.clear) await auth.state.keys.clear();
        else fs.rmSync('./session', { recursive: true, force: true });
      }
      try { sock.ws?.close?.(); } catch {}
      await lock.release();
    };
    return { sock, close, persistent: Boolean(getPool()), registered: auth.state.creds.registered };
  } catch (error) {
    await lock.release();
    throw error;
  }
}
module.exports = { openConnection };
