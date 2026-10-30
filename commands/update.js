const settings = require('../settings');
module.exports = async function updateCommand(sock, chatId, message) {
  await sock.sendMessage(chatId, { text: `🔄 *تحديث ${settings.botName}*\n\nالتحديث الآمن بيتم من مستودع نسختك، مش باستبدالها بالأصل الإنجليزي.\n\n1. اعمل نسخة احتياطية من الإعدادات ومفتاح الجلسة.\n2. حدّث كود نسختك على GitHub.\n3. أعد نشر الفرع على Heroku أو نفّذ git pull ثم npm ci على جهازك.\n4. أعد تشغيل نسخة واحدة فقط.\n\nالمستودع: ${settings.repositoryUrl}\n🔒 لا ترفع session أو .env أو SESSION_ENCRYPTION_KEY.` }, { quoted: message });
};
