const fs = require('node:fs');
const path = require('node:path');
const settings = require('../settings');
module.exports = async function githubCommand(sock, chatId, message) {
  const text = `🖤 *${settings.botName}*\n\nبوت واتساب عربي لإدارة المجموعات.\nالإصدار: ${settings.version}\nالمستودع: ${settings.repositoryUrl}\n\nمبني على Knightbot-MD؛ حقوق مطوّري الأصل محفوظة في NOTICE.md.`;
  await sock.sendMessage(chatId, { image: fs.readFileSync(path.join(__dirname, '../assets/black-x.jpg')), caption: text }, { quoted: message });
};
