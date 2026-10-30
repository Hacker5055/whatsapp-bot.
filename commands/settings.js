const fs = require('../lib/data-fs');
const settings = require('../settings');
const isOwnerOrSudo = require('../lib/isOwner');
const read = (name, fallback) => { try { return JSON.parse(fs.readFileSync('./data/' + name)); } catch { return fallback; } };
const on = value => value ? 'مفعّل ✅' : 'معطّل ❌';
module.exports = async function settingsCommand(sock, chatId, message) {
  if (!message.key.fromMe && !await isOwnerOrSudo(message.key.participant || message.key.remoteJid, sock, chatId)) return sock.sendMessage(chatId, { text: '❌ الأمر ده لمالك البوت فقط.' }, { quoted: message });
  const group = read('userGroupData.json', {});
  const flag = (key) => on(group[key]?.[chatId]?.enabled ?? group[key]?.[chatId]);
  const lines = [`⚙️ *إعدادات ${settings.botName}*`, '', `الوضع: ${read('messageCount.json', {}).isPublic ? 'عام' : 'خاص'}`];
  for (const [label, file, key] of [['مشاهدة الحالات', 'autoStatus.json', 'enabled'], ['قراءة الرسائل', 'autoread.json', 'enabled'], ['مؤشر الكتابة', 'autotyping.json', 'enabled'], ['منع الخاص', 'pmblocker.json', 'enabled'], ['منع المكالمات', 'anticall.json', 'enabled'], ['مكافحة الحذف', 'antidelete.json', 'enabled']]) lines.push(`${label}: ${on(read(file, {})[key])}`);
  lines.push(`التفاعل التلقائي: ${on(group.autoReaction)}`);
  if (chatId.endsWith('@g.us')) {
    lines.push('', '*إعدادات المجموعة الحالية:*');
    for (const [label, key] of [['منع الروابط', 'antilink'], ['منع الشتائم', 'antibadword'], ['منع المنشن', 'antitag'], ['منع البوتات', 'antibot'], ['الترحيب', 'welcome'], ['الوداع', 'goodbye'], ['المحادثة', 'chatbot']]) {
      let value = group[key]?.[chatId];
      if (key === 'antibot') value = read('antibot.json', {})[chatId];
      lines.push(`${label}: ${on(value?.enabled ?? value)}`);
    }
  }
  await sock.sendMessage(chatId, { text: lines.join('\n') }, { quoted: message });
};
