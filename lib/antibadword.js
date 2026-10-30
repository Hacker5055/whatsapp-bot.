const { loadUserGroupData, saveUserGroupData, incrementWarningCount, resetWarningCount } = require('./index');
const isAdmin = require('./isAdmin');
const { sameJid } = require('./isOwner');
const { WARN_COUNT } = require('../config');

const normalizeWords = text => String(text || '').toLowerCase()
  .replace(/[أإآ]/g, 'ا').replace(/ى/g, 'ي').replace(/ة/g, 'ه')
  .replace(/[\u064B-\u065F\u0670\u0640]/g, '')
  .replace(/[^\p{L}\p{N}\s]/gu, ' ').replace(/\s+/g, ' ').trim();
function configFor(group) {
  const config = loadUserGroupData().antibadword?.[group] || {};
  return { enabled: !!config.enabled, action: config.action || 'delete', words: Array.isArray(config.words) ? config.words : [] };
}
function containsBadword(text, words) {
  const normalized = ' ' + normalizeWords(text) + ' ';
  return words.some(word => word && normalized.includes(' ' + normalizeWords(word) + ' '));
}
async function handleAntiBadwordCommand(sock, chatId, message, match = '') {
  const reply = text => sock.sendMessage(chatId, { text }, { quoted: message });
  if (!chatId.endsWith('@g.us')) return reply('👥 الأمر ده للمجموعات فقط.');
  const [action, ...rest] = match.trim().split(/\s+/);
  const word = rest.join(' ').trim();
  const cfg = configFor(chatId);
  const save = patch => {
    const data = loadUserGroupData();
    data.antibadword ||= {};
    data.antibadword[chatId] = { ...configFor(chatId), ...patch };
    saveUserGroupData(data);
  };
  if (!action) return reply(`🛡️ *منع الشتائم*\n\nالحالة: ${cfg.enabled ? 'مفعّل' : 'معطّل'}\nالإجراء: ${{ delete: 'حذف', warn: 'تحذير', kick: 'طرد' }[cfg.action]}\nعدد الكلمات المخصصة: ${cfg.words.length}\n\n*.منع_الشتائم تشغيل / ايقاف*\n*.منع_الشتائم تعيين حذف | طرد | تحذير*\n*.منع_الشتائم add كلمة*\n*.منع_الشتائم del كلمة*\n*.منع_الشتائم list*\n\nمفيش قائمة شتائم مفروضة؛ مشرف المجموعة يضيف الكلمات المناسبة.`);
  if (['on', 'off'].includes(action)) {
    save({ enabled: action === 'on' });
    return reply(action === 'on' ? '✅ تم تفعيل منع الشتائم. أضف كلمات مخصصة لو القائمة فاضية.' : '✅ تم تعطيل منع الشتائم.');
  }
  if (action === 'set') {
    if (!['delete', 'kick', 'warn'].includes(word)) return reply('❌ اختر حذف أو طرد أو تحذير.');
    save({ action: word }); return reply('✅ تم تحديث إجراء منع الشتائم.');
  }
  if (action === 'add') {
    if (!word || word.length > 80) return reply('اكتب كلمة أو عبارة لا تتجاوز 80 حرف.');
    if (cfg.words.length >= 200 && !cfg.words.includes(word)) return reply('الحد الأقصى 200 كلمة لكل مجموعة.');
    save({ words: [...new Set([...cfg.words, word])] }); return reply('✅ تمت إضافة الكلمة للقائمة.');
  }
  if (action === 'del') {
    save({ words: cfg.words.filter(item => item !== word) }); return reply('✅ تمت إزالة الكلمة من القائمة.');
  }
  if (action === 'list') return reply(cfg.words.length ? '📝 الكلمات المحظورة:\n' + cfg.words.map((w, i) => `${i + 1}. ${w}`).join('\n') : 'القائمة فاضية. أضف كلمة بـ .منع_الشتائم add كلمة');
  return reply('❌ اختيار غير صحيح. اكتب .منع_الشتائم لعرض الاستخدام.');
}
async function handleBadwordDetection(sock, chatId, message, text, senderId) {
  if (!chatId.endsWith('@g.us') || message.key.fromMe) return false;
  const cfg = configFor(chatId);
  if (!cfg.enabled || !containsBadword(text, cfg.words)) return false;
  const status = await isAdmin(sock, chatId, senderId);
  if (!status.isBotAdmin || status.isSenderAdmin) return false;
  const isOwnerOrSudo = require('./isOwner');
  if (await isOwnerOrSudo(senderId, sock, chatId)) return false;
  try { await sock.sendMessage(chatId, { delete: message.key }); } catch { return false; }
  const mention = `@${senderId.split('@')[0]}`;
  const send = text => sock.sendMessage(chatId, { text, mentions: [senderId] });
  if (cfg.action === 'delete') await send(`🛡️ ${mention}، الكلمة دي غير مسموحة في المجموعة.`);
  else if (cfg.action === 'kick') {
    try { await sock.groupParticipantsUpdate(chatId, [senderId], 'remove'); await send(`🛡️ تم طرد ${mention} بسبب مخالفة الكلمات المحظورة.`); }
    catch { await send('❌ تعذر الطرد. راجع صلاحيات البوت.'); }
  } else {
    const count = await incrementWarningCount(chatId, senderId);
    if (count >= WARN_COUNT) {
      try { await sock.groupParticipantsUpdate(chatId, [senderId], 'remove'); await resetWarningCount(chatId, senderId); await send(`🛡️ تم طرد ${mention} بعد ${WARN_COUNT} تحذيرات.`); }
      catch { await send('❌ تعذر الطرد. راجع صلاحيات البوت.'); }
    } else await send(`⚠️ ${mention}، تحذير ${count}/${WARN_COUNT} بسبب الكلمات المحظورة.`);
  }
  return true;
}
module.exports = { handleAntiBadwordCommand, handleBadwordDetection, normalizeWords, containsBadword };
