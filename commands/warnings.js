const fs = require('../lib/data-fs');
const path = require('node:path');
const { buildComparableIds } = require('../lib/jidHelper');
module.exports = async function warningsCommand(sock, chatId, mentionedJidList = []) {
  if (!mentionedJidList.length) return sock.sendMessage(chatId, { text: 'منشن عضو عشان تعرض تحذيراته.' });
  let warnings = {};
  try { warnings = JSON.parse(fs.readFileSync(path.join(process.cwd(), 'data/userGroupData.json'))).warnings || {}; } catch {}
  const target = mentionedJidList[0];
  const ids = buildComparableIds(target);
  const group = warnings[chatId] || {};
  const count = Object.entries(group).reduce((sum, [id, count]) => sum + (buildComparableIds(id).some(value => ids.includes(value)) ? Number(count) : 0), 0);
  await sock.sendMessage(chatId, { text: `⚠️ @${target.split('@')[0]} عنده ${count} تحذير.`, mentions: [target] });
};
