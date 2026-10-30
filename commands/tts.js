const gTTS = require('gtts');
const fs = require('node:fs');
const path = require('node:path');
const os = require('node:os');
async function ttsCommand(sock, chatId, text, message, language = 'ar') {
  if (!text) return sock.sendMessage(chatId, { text: 'اكتب النص المطلوب. مثال: .نطق أهلاً بيك في Black X' }, { quoted: message });
  if (text.length > 500) return sock.sendMessage(chatId, { text: 'الحد الأقصى 500 حرف في الرسالة الصوتية الواحدة.' }, { quoted: message });
  if (!/^[a-z]{2}(?:-[A-Z]{2})?$/.test(language)) language = 'ar';
  const file = path.join(os.tmpdir(), `blackx-tts-${Date.now()}-${Math.random().toString(36).slice(2)}.mp3`);
  try {
    await new Promise((resolve, reject) => new gTTS(text, language).save(file, err => err ? reject(err) : resolve()));
    await sock.sendMessage(chatId, { audio: fs.readFileSync(file), mimetype: 'audio/mpeg', ptt: true }, { quoted: message });
  } catch {
    await sock.sendMessage(chatId, { text: '❌ تعذر إنشاء الصوت. خدمة النطق غير متاحة مؤقتًا؛ جرّب بعد شوية.' }, { quoted: message });
  } finally { fs.rmSync(file, { force: true }); }
}
module.exports = ttsCommand;
