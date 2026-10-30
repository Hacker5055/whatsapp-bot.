const axios = require('axios');
const settings = require('../settings');
module.exports = async function weatherCommand(sock, chatId, message, city) {
  if (!city) return sock.sendMessage(chatId, { text: '🌤️ اكتب اسم المدينة. مثال: .طقس القاهرة' }, { quoted: message });
  if (!settings.openWeatherApiKey) return sock.sendMessage(chatId, { text: '🌤️ أمر الطقس محتاج تفعيل OPENWEATHER_API_KEY في إعدادات البوت الأول. راجع دليل الإعدادات.' }, { quoted: message });
  try {
    const { data: weather } = await axios.get('https://api.openweathermap.org/data/2.5/weather', {
      params: { q: city, appid: settings.openWeatherApiKey, units: 'metric', lang: 'ar' }, timeout: 15000
    });
    const text = `🌤️ *الطقس في ${weather.name}*\n\nالحالة: ${weather.weather[0].description}\n🌡️ الحرارة: ${weather.main.temp}°م\nالإحساس بالحرارة: ${weather.main.feels_like}°م\n💧 الرطوبة: ${weather.main.humidity}%\n💨 الرياح: ${weather.wind.speed} متر/ثانية`;
    await sock.sendMessage(chatId, { text }, { quoted: message });
  } catch {
    await sock.sendMessage(chatId, { text: '❌ تعذر جلب الطقس. راجع اسم المدينة أو مفتاح الخدمة وجرّب تاني.' }, { quoted: message });
  }
};
