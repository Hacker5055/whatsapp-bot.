require('dotenv').config();

// لا توجد مفاتيح خاصة بمطوّر آخر في هذه النسخة.
global.APIs = {
  xteam: 'https://api.xteam.xyz',
  lol: 'https://api.lolhuman.xyz',
  neoxr: 'https://api.neoxr.my.id',
  violetics: 'https://violetics.pw',
  zenzapis: 'https://zenzapis.xyz',
  fgmods: 'https://api-fgmods.ddns.net'
};
global.APIKeys = Object.fromEntries(Object.entries(global.APIs).map(([key, url]) => [url, process.env[`${key.toUpperCase()}_API_KEY`] || '']));
module.exports = { WARN_COUNT: Math.max(1, Number(process.env.WARN_COUNT) || 3), APIs: global.APIs, APIKeys: global.APIKeys };
