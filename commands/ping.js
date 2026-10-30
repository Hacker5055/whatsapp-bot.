const settings = require('../settings');
function formatTime(seconds) {
  const s = Math.floor(seconds);
  return `${Math.floor(s / 3600)} ساعة و${Math.floor(s % 3600 / 60)} دقيقة و${s % 60} ثانية`;
}
async function pingCommand(sock, chatId, message) {
  const start = Date.now();
  await sock.sendMessage(chatId, { text: '🏓 جاري قياس السرعة…' }, { quoted: message });
  await sock.sendMessage(chatId, { text: `🖤 *${settings.botName}*\n\n⚡ زمن الرد التقريبي: ${Date.now() - start} مللي ثانية\n⏱️ مدة التشغيل: ${formatTime(process.uptime())}\n🔖 الإصدار: ${settings.version}\n✅ البوت شغال` }, { quoted: message });
}
module.exports = pingCommand;
module.exports.formatTime = formatTime;
