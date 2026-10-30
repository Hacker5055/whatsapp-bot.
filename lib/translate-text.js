const axios = require('axios');
async function translateText(text, target = 'ar') {
  const value = String(text || '').trim();
  if (!value) return '';
  if (value.length > 5000) throw new Error('النص أطول من الحد المسموح للترجمة.');
  const { data } = await axios.get('https://translate.googleapis.com/translate_a/single', {
    params: { client: 'gtx', sl: 'auto', tl: target, dt: 't', q: value }, timeout: 12000
  });
  if (!Array.isArray(data?.[0])) throw new Error('رد خدمة الترجمة غير صالح.');
  const translated = data[0].map(part => part?.[0] || '').join('');
  if (!translated) throw new Error('خدمة الترجمة لم ترجع نصًا.');
  return translated;
}
module.exports = { translateText };
