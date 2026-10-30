/** Black X — Arabic localization and deployment adaptations.
 * Based on Knightbot-MD by Mr Unique Hacker / Professor. See NOTICE.md.
 */
require('dotenv').config();
const settings = require('./settings');
const { DisconnectReason, jidDecode, jidNormalizedUser } = require('@whiskeysockets/baileys');
const qrcode = require('qrcode');
const { openConnection } = require('./lib/connection');
const { closeDatabase } = require('./lib/database');
const state = require('./lib/state-store');
const groupSilence = require('./lib/group-silence');
const { attachLocalization } = require('./lib/localize');
const { normalizePhone } = require('./lib/phone');

global.packname = settings.packname;
global.author = settings.author;
global.botname = settings.botName;
global.themeemoji = '✦';

let stopping = false;
let active;
let storeTimer;
let reconnectTimer;
const shutdown = async (code = 0) => {
  if (stopping) return;
  stopping = true;
  clearTimeout(reconnectTimer);
  clearInterval(storeTimer);
  try { await state.flush(); } catch { console.error('تعذر حفظ آخر الإعدادات.'); }
  await active?.close();
  await closeDatabase();
  process.exit(code);
};
process.on('SIGTERM', () => shutdown(0));
process.on('SIGINT', () => shutdown(0));
process.on('unhandledRejection', error => console.error('❌ خطأ غير معالج:', error?.message || error));
process.on('uncaughtException', error => {
  console.error('❌ خطأ غير متوقع؛ ستتوقف النسخة بأمان:', error?.message || error);
  shutdown(1);
});

async function start(attempt = 0) {
  if (stopping) return;
  let connection;
  try {
    const pairingNumber = process.env.PAIRING_NUMBER ? normalizePhone(process.env.PAIRING_NUMBER) : '';
    connection = await openConnection({
      pairingNumber,
      onPairingCode: code => {
        console.log(`\n🔑 كود ربط Black X: ${code}`);
        console.log('واتساب ← الأجهزة المرتبطة ← ربط جهاز ← الربط برقم الهاتف. أدخل الكود الآن.');
        console.log('الكود مؤقت؛ بعد نجاح الربط احذف PAIRING_NUMBER من إعدادات Heroku.\n');
      }
    });
    active = connection;
    await state.hydrate();
    groupSilence.load();
    // Load commands only AFTER remote settings have been restored.
    const main = require('./main');
    const store = require('./lib/lightweight_store');
    store.readFromFile();
    const { smsg } = require('./lib/myfunc');
    const sock = connection.sock;
    attachLocalization(sock);
    groupSilence.protect(sock);
    sock.ev.on('blackx:fatal', () => shutdown(1));
    sock.decodeJid = jid => {
      if (!jid) return jid;
      const decoded = jidDecode(jid);
      return decoded?.user && decoded?.server ? `${decoded.user}@${decoded.server}` : jid;
    };
    sock.getName = async jid => store.contacts[jid]?.name || jid.split('@')[0];
    sock.serializeM = m => smsg(sock, m, store);
    sock.public = settings.commandMode === 'public';
    store.bind(sock.ev);
    storeTimer = setInterval(() => store.writeToFile(), settings.storeWriteInterval);
    storeTimer.unref();
    sock.ev.on('contacts.update', contacts => {
      for (const contact of contacts) store.contacts[contact.id] = { id: contact.id, name: contact.notify || contact.name || '' };
    });
    const seen = new Set();
    sock.ev.on('messages.upsert', async update => {
      if (update.type !== 'notify') return;
      for (const original of update.messages) {
        if (!original.message || !original.key?.id || seen.has(original.key.id)) continue;
        if (groupSilence.isSilent(original.key.remoteJid) && !/^\.صمت\s+(?:إيقاف|ايقاف|off)\s*$/i.test(original.message?.conversation || original.message?.extendedTextMessage?.text || '')) continue;
        seen.add(original.key.id);
        if (seen.size > 2000) seen.delete(seen.values().next().value);
        const message = { ...original, message: original.message.ephemeralMessage?.message || original.message };
        try {
          const target = message.key.remoteJid;
          const text = (message.message?.conversation || message.message?.extendedTextMessage?.text || '').trim();
          // Private self-chat control: never expose group IDs or control commands to colleagues.
          if (message.key.fromMe && target && !target.endsWith('@g.us') && target !== 'status@broadcast') {
            if (text === '.مجموعاتي') {
              const groups = await sock.groupFetchAllParticipating();
              const lines = Object.values(groups).map(g => `${g.subject}: ${g.id}`);
              await sock.sendMessage(target, { text: lines.length ? lines.join('\n').slice(0, 3500) : 'لا توجد مجموعات.' });
              continue;
            }
            const control = text.match(/^\.صمت\s+(تشغيل|إيقاف|ايقاف|on|off)\s+([0-9-]+@g\.us)$/i);
            if (control) {
              await groupSilence.setSilent(control[2], /^(تشغيل|on)$/i.test(control[1]));
              await sock.sendMessage(target, { text: 'تم تحديث صمت المجموعة. لا يُرسل أي إشعار إليها.' });
              continue;
            }
          }
          if (message.key.remoteJid === 'status@broadcast') {
            await main.handleStatus(sock, { ...update, messages: [message] });
          } else {
            const { handleAntibotDetection } = require('./commands/antibot');
            if (message.key.remoteJid?.endsWith('@g.us') && !message.key.fromMe) await handleAntibotDetection(sock, message);
            await main.handleMessages(sock, { ...update, messages: [message] }, true);
          }
        } catch (error) {
          console.error('❌ تعذر تنفيذ الأمر:', error?.message || error);
          await sock.sendMessage(message.key.remoteJid, { text: '❌ حصل خطأ أثناء تنفيذ الأمر. جرّب مرة تانية.' }).catch(() => {});
        }
      }
    });
    sock.ev.on('group-participants.update', update => {
      if (!groupSilence.isSilent(update.id)) main.handleGroupParticipantUpdate(sock, update).catch(console.error);
    });
    sock.ev.on('call', async calls => {
      const { readState } = require('./commands/anticall');
      if (!readState().enabled) return;
      for (const call of calls) {
        try {
          if (call.id && call.from) await sock.rejectCall(call.id, call.from);
          if (call.from) {
            await sock.sendMessage(call.from, { text: '📵 المكالمات على البوت غير متاحة. ابعت رسالتك في المجموعة.' });
            await sock.updateBlockStatus(call.from, 'block');
          }
        } catch {}
      }
    });
    let opened = false;
    sock.ev.on('connection.update', async update => {
      if (update.qr && !pairingNumber) {
        console.log('📱 امسح الكود من واتساب ← الأجهزة المرتبطة ← ربط جهاز:');
        console.log(await qrcode.toString(update.qr, { type: 'terminal', small: true }));
      }
      if (update.connection === 'connecting') console.log('🔄 جاري توصيل Black X بواتساب…');
      if (update.connection === 'open') {
        opened = true;
        console.log(`✅ ${settings.botName} متصل وجاهز. اكتب .اوامر أو .menu في واتساب.`);
        console.log(`🔐 حفظ الجلسة: ${connection.persistent ? 'PostgreSQL مشفّر' : 'مجلد session محلي — غير مناسب لـ Heroku'}`);
        if (!connection.registered) {
          const jid = jidNormalizedUser(sock.user.id);
          await sock.sendMessage(jid, { text: `✅ *${settings.botName} متصل بنجاح!*\n\nأنا مساعدك العربي لإدارة المجموعات.\nاكتب *.اوامر* لعرض الأوامر.\n🔒 الوضع الافتراضي خاص؛ اكتب *.وضع عام* للسماح للجميع.` }).catch(() => {});
        }
      }
      if (update.connection === 'close' && !stopping) {
        clearInterval(storeTimer);
        const status = update.lastDisconnect?.error?.output?.statusCode;
        const loggedOut = status === DisconnectReason.loggedOut || status === 401;
        const conflict = status === DisconnectReason.connectionReplaced || status === 440;
        await connection.close({ logout: loggedOut });
        if (active === connection) active = undefined;
        if (loggedOut) {
          console.error('❌ واتساب سجّل خروج الجهاز. تم مسح الجلسة؛ أعد الربط برقمك. لن نمسح إعدادات المجموعات.');
          return;
        }
        if (conflict) {
          console.error('❌ توجد نسخة أخرى متصلة بنفس الحساب. أوقفها ثم شغّل نسخة واحدة. الجلسة لم تُمسح.');
          return;
        }
        if (!opened && !connection.registered && pairingNumber) {
          console.error('❌ لم يكتمل الربط. تحقق من الرقم وأعد تشغيل عامل Heroku بكود جديد.');
          return;
        }
        const wait = Math.min(60000, 3000 * 2 ** Math.min(attempt, 5));
        console.log(`🔄 انقطع الاتصال؛ إعادة المحاولة بعد ${wait / 1000} ثانية.`);
        reconnectTimer = setTimeout(() => start(attempt + 1), wait);
      }
    });
  } catch (error) {
    await connection?.close();
    if (String(error.message).startsWith('SESSION_BUSY')) {
      console.error('❌ ' + error.message);
      return;
    }
    console.error('❌ تعذر بدء Black X:', error.message);
    if (process.env.DYNO) {
      reconnectTimer = setTimeout(() => start(Math.min(attempt + 1, 5)), 15000);
    } else process.exitCode = 1;
  }
}
start().catch(error => { console.error(error.message); process.exitCode = 1; });
