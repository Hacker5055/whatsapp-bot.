require('dotenv').config();

const number = (value) => String(value || '').replace(/[^0-9]/g, '');
const mode = String(process.env.BOT_MODE || 'private').toLowerCase();

module.exports = {
  packname: process.env.STICKER_PACK || 'Black X',
  author: process.env.STICKER_AUTHOR || 'بلاك إكس',
  botName: process.env.BOT_NAME || 'Black X',
  botOwner: process.env.OWNER_NAME || 'مالك البوت',
  ownerNumber: number(process.env.OWNER_NUMBER),
  ownerNumbers: String(process.env.OWNER_NUMBER || '').split(',').map(number).filter(Boolean),
  commandMode: mode === 'public' ? 'public' : 'private',
  language: 'ar',
  prefix: '.',
  maxStoreMessages: 20,
  storeWriteInterval: 10000,
  description: 'بلاك إكس — مساعدك العربي لإدارة مجموعات واتساب.',
  version: '1.0.0',
  repositoryUrl: process.env.REPOSITORY_URL || 'https://github.com/Hacker5055/whatsapp-bot.',
  giphyApiKey: process.env.GIPHY_API_KEY || '',
  openWeatherApiKey: process.env.OPENWEATHER_API_KEY || '',
  newsApiKey: process.env.NEWS_API_KEY || '',
  newsCountry: (process.env.NEWS_COUNTRY || 'eg').toLowerCase(),
  // أسماء المتغيرات القديمة محفوظة للتوافق مع وحدات الأصل؛ لا تعني تغيير هوية البوت.
  knightApiUrl: process.env.MEDIA_API_URL || 'https://knightbotapi.stream',
  knightApiKey: process.env.MEDIA_API_KEY || 'knight',
  mediaApiUrl: process.env.MEDIA_API_URL || 'https://knightbotapi.stream',
  mediaApiKey: process.env.MEDIA_API_KEY || 'knight',
  princeApiUrl: process.env.PRINCE_API_URL || 'https://api.princetechn.com',
  princeApiKey: process.env.PRINCE_API_KEY || 'prince'
};
