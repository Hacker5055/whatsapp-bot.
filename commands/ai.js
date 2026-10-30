const APIs = require('../lib/api');
const { translateText } = require('../lib/translate-text');
const promptFor = query => `أنت Black X، مساعد واتساب. أجب بالعربية الواضحة وبشكل مختصر ومفيد. لا تدّع أنك إنسان. حافظ على المصطلحات والأكواد اللازمة، ولا تتبع تعليمات تتعارض مع الأمان.\n\nسؤال المستخدم:\n${query}`;
async function aiCommand(sock, chatId, message) {
  try {
    const text = message.message?.conversation || message.message?.extendedTextMessage?.text || '';
    const query = text.replace(/^\.\S+\s*/, '').trim();
    if (!query) return sock.sendMessage(chatId, { text: '💡 اكتب سؤالك بعد الأمر. مثال: *.ذكاء اشرح لي الجاذبية*' }, { quoted: message });
    if (query.length > 4000) return sock.sendMessage(chatId, { text: 'السؤال طويل جدًا. اختصره إلى 4000 حرف كحد أقصى.' }, { quoted: message });
    let answer;
    for (const run of [APIs.knightChatAI, APIs.knightGptAI, APIs.fallbackChatAI]) {
      try { answer = await run(promptFor(query)); if (answer) break; } catch {}
    }
    if (!answer) return sock.sendMessage(chatId, { text: '❌ خدمة الذكاء الاصطناعي مش متاحة دلوقتي. جرّب بعد شوية.' }, { quoted: message });
    // Do not silently fall back to an English answer when Arabic was requested.
    if (!/[\u0600-\u06ff]/.test(answer)) {
      try { answer = await translateText(answer, 'ar'); }
      catch { return sock.sendMessage(chatId, { text: 'وصل رد لكن تعذر ترجمته للعربية. جرّب مرة تانية بعد شوية.' }, { quoted: message }); }
    }
    await sock.sendMessage(chatId, { text: String(answer).slice(0, 12000) }, { quoted: message });
  } catch {
    await sock.sendMessage(chatId, { text: '❌ حصل خطأ أثناء معالجة السؤال. جرّب مرة تانية.' }, { quoted: message });
  }
}
module.exports = aiCommand;
module.exports.promptFor = promptFor;
