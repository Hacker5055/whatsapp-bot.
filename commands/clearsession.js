const isOwnerOrSudo = require('../lib/isOwner');
const { getPool } = require('../lib/database');
module.exports = async function clearSessionCommand(sock, chatId, message) {
  const sender = message.key.participant || message.key.remoteJid;
  if (!message.key.fromMe && !await isOwnerOrSudo(sender, sock, chatId)) return sock.sendMessage(chatId, { text: '❌ الأمر ده لمالك البوت فقط.' }, { quoted: message });
  await sock.sendMessage(chatId, { text: `🔐 *فحص جلسة ${require('../settings').botName}*\n\nالحفظ: ${getPool() ? 'PostgreSQL مشفّر' : 'مجلد محلي'}\nالحالة: البوت متصل\n\nلأسباب أمنية، الأمر ده لا يحذف مفاتيح التشفير أثناء اتصال واتساب. لتغيير الرقم: سجل خروج الجهاز من واتساب، ثم اتبع خطوات إعادة الربط في الدليل. لا تحذف مفاتيح الجلسة عشوائيًا.` }, { quoted: message });
};
