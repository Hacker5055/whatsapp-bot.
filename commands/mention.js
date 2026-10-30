const fs = require('../lib/data-fs');
const path = require('node:path');
const { downloadContentFromMessage } = require('@whiskeysockets/baileys');
const isOwnerOrSudo = require('../lib/isOwner');
const { sameJid } = require('../lib/isOwner');
const file = path.join(__dirname, '../data/mention.json');
function loadState() { try { return JSON.parse(fs.readFileSync(file, 'utf8')); } catch { return { enabled: false, type: 'text', text: 'أهلًا! اكتب .اوامر لعرض الأوامر.' }; } }
function saveState(state) { fs.writeFileSync(file, JSON.stringify(state)); }
const getContext = message => {
  const m = message.message || {};
  return m.extendedTextMessage?.contextInfo || m.imageMessage?.contextInfo || m.videoMessage?.contextInfo || m.audioMessage?.contextInfo || m.stickerMessage?.contextInfo || m.documentMessage?.contextInfo || {};
};
async function handleMentionDetection(sock, chatId, message) {
  const state = loadState();
  if (!state.enabled || message.key.fromMe) return;
  const ids = [sock.user?.id, sock.user?.lid].filter(Boolean);
  if (!(getContext(message).mentionedJid || []).some(id => ids.some(bot => sameJid(id, bot)))) return;
  const content = state.base64 ? { [state.type]: Buffer.from(state.base64, 'base64') } : { text: state.text || 'أهلًا! اكتب .اوامر لعرض الأوامر.' };
  if (state.mimetype) content.mimetype = state.mimetype;
  if (state.type === 'audio') content.ptt = !!state.ptt;
  if (state.type === 'video') content.gifPlayback = !!state.gifPlayback;
  if (state.type === 'document') content.fileName = state.fileName || 'black-x-file';
  await sock.sendMessage(chatId, content, { quoted: message });
}
async function mentionToggleCommand(sock, chatId, message, match) {
  const sender = message.key.participant || message.key.remoteJid;
  if (!message.key.fromMe && !await isOwnerOrSudo(sender, sock, chatId)) return sock.sendMessage(chatId, { text: '❌ الأمر للمالك أو المساعد فقط.' }, { quoted: message });
  const state = loadState();
  if (!match) return sock.sendMessage(chatId, { text: `الرد على المنشن: ${state.enabled ? 'مفعّل' : 'معطّل'}\n.mention تشغيل / ايقاف\nلحفظ رد: رد على رسالة بالأمر .setmention` }, { quoted: message });
  if (!['on', 'off'].includes(match.trim())) return sock.sendMessage(chatId, { text: 'استخدم .mention تشغيل أو .mention ايقاف' }, { quoted: message });
  state.enabled = match.trim() === 'on'; saveState(state);
  await sock.sendMessage(chatId, { text: state.enabled ? '✅ تم تفعيل الرد على المنشن.' : '✅ تم تعطيل الرد على المنشن.' }, { quoted: message });
}
async function setMentionCommand(sock, chatId, message) {
  const sender = message.key.participant || message.key.remoteJid;
  if (!message.key.fromMe && !await isOwnerOrSudo(sender, sock, chatId)) return sock.sendMessage(chatId, { text: '❌ الأمر للمالك أو المساعد فقط.' }, { quoted: message });
  const quoted = getContext(message).quotedMessage;
  if (!quoted) return sock.sendMessage(chatId, { text: 'رد على رسالة نصية أو وسائط بالأمر .setmention' }, { quoted: message });
  const type = ['sticker', 'image', 'video', 'audio', 'document'].find(t => quoted[t + 'Message']);
  const state = { ...loadState() };
  delete state.base64;
  if (!type) {
    const text = quoted.conversation || quoted.extendedTextMessage?.text;
    if (!text) return sock.sendMessage(chatId, { text: '❌ نوع الرسالة غير مدعوم.' }, { quoted: message });
    state.type = 'text'; state.text = text;
  } else {
    try {
      const media = quoted[type + 'Message'];
      const stream = await downloadContentFromMessage(media, type);
      const chunks = []; let size = 0;
      for await (const chunk of stream) {
        size += chunk.length;
        if (size > 1024 * 1024) { stream.destroy?.(); throw new Error('الملف أكبر من 1 ميجابايت.'); }
        chunks.push(chunk);
      }
      state.type = type; state.base64 = Buffer.concat(chunks).toString('base64');
      state.mimetype = media.mimetype; state.ptt = media.ptt; state.gifPlayback = media.gifPlayback; state.fileName = media.fileName;
    } catch (error) { return sock.sendMessage(chatId, { text: '❌ تعذر حفظ الوسائط. الحد الأقصى 1 ميجابايت.' }, { quoted: message }); }
  }
  // Media lives in the database-backed JSON state, not an
  // ephemeral assets file, so custom mention replies survive Heroku restarts.
  delete state.assetPath;
  saveState(state);
  await sock.sendMessage(chatId, { text: '✅ تم حفظ رد المنشن، وهيفضل محفوظ بعد إعادة التشغيل.' }, { quoted: message });
}
module.exports = { handleMentionDetection, mentionToggleCommand, setMentionCommand };
