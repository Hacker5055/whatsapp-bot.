const settings = require('../settings');
module.exports = async function pairCommand(sock, chatId, message) {
  await sock.sendMessage(chatId, { text: `🔗 *ربط ${settings.botName} برقم واتساب*\n\n1. افتح واتساب على الرقم المخصص للبوت.\n2. الأجهزة المرتبطة ← ربط جهاز ← الربط برقم الهاتف.\n3. على جهازك نفّذ:\n\`npm run pair -- 201012345678\`\nاستبدل المثال برقمك الدولي بدون +.\n4. أدخل الكود اللي يظهر في الطرفية.\n\nعلى Heroku اتبع دليل docs/HEROKU_AR.md.\n🔒 لا تشارك الكود أو ملفات الجلسة أو مفتاح التشفير مع أي حد.` }, { quoted: message });
};
