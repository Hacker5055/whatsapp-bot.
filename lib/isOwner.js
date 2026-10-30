const settings = require('../settings');
const { isSudo } = require('./index');
const { buildComparableIds } = require('./jidHelper');
const same = (a, b) => {
  if (!a || !b) return false;
  const aa = buildComparableIds(a), bb = buildComparableIds(b);
  return aa.some(id => bb.includes(id));
};
async function isOwnerOrSudo(senderId, sock = null, chatId = null) {
  if (!senderId) return false;
  const ownIds = [sock?.user?.id, sock?.user?.lid, ...settings.ownerNumbers.map(n => `${n}@s.whatsapp.net`)].filter(Boolean);
  if (ownIds.some(id => same(senderId, id))) return true;
  if (chatId?.endsWith('@g.us') && sock?.groupMetadata) {
    try {
      const meta = await sock.groupMetadata(chatId);
      const sender = meta.participants?.find(p => [p.id, p.lid, p.phoneNumber].some(id => same(id, senderId)));
      if (sender && ownIds.some(id => [sender.id, sender.lid, sender.phoneNumber].some(other => same(id, other)))) return true;
    } catch {}
  }
  return isSudo(senderId);
}
module.exports = isOwnerOrSudo;
module.exports.sameJid = same;
