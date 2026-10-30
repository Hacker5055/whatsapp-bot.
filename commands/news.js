const axios = require('axios');
const settings = require('../settings');
const { translateText } = require('../lib/translate-text');
module.exports = async function newsCommand(sock, chatId) {
  if (!settings.newsApiKey) return sock.sendMessage(chatId, { text: '📰 أمر الأخبار محتاج تفعيل NEWS_API_KEY في إعدادات البوت الأول. راجع دليل الإعدادات.' });
  try {
    const { data } = await axios.get('https://newsapi.org/v2/top-headlines', { params: { country: settings.newsCountry, pageSize: 5, apiKey: settings.newsApiKey }, timeout: 15000 });
    if (!data.articles?.length) return sock.sendMessage(chatId, { text: 'مفيش أخبار متاحة دلوقتي. جرّب بعد شوية.' });
    const lines = ['📰 *آخر الأخبار*', ''];
    for (const [i, article] of data.articles.entries()) {
      let title = article.title;
      try { title = await translateText(title, 'ar'); } catch { title += ' [العنوان الأصلي]'; }
      lines.push(`${i + 1}. ${title}`, article.url, '');
    }
    await sock.sendMessage(chatId, { text: lines.join('\n') });
  } catch { await sock.sendMessage(chatId, { text: '❌ تعذر جلب الأخبار. راجع مفتاح الخدمة وجرّب بعد شوية.' }); }
};
