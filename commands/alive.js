const settings = require('../settings');
const fs = require('../lib/data-fs');
module.exports = async function aliveCommand(sock, chatId, message) {
  let isPublic = settings.commandMode === 'public';
  try { isPublic = JSON.parse(fs.readFileSync('./data/messageCount.json')).isPublic; } catch {}
  await sock.sendMessage(chatId, { text: `🖤 *${settings.botName} شغال!*\n\n✅ الحالة: متصل\n🔖 الإصدار: ${settings.version}\n⚙️ الوضع: ${isPublic ? 'عام' : 'خاص'}\n\n• إدارة المجموعات\n• الحماية من الروابط والشتائم\n• أوامر ترفيهية وذكاء اصطناعي\n\nاكتب *.اوامر* لعرض القائمة.` }, { quoted: message });
};
