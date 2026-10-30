const { buildComparableIds } = require('./jidHelper');
const matches = (a, b) => {
  if (!a || !b) return false;
  const ids = buildComparableIds(b);
  return buildComparableIds(a).some(id => ids.includes(id));
};
const isAdminRole = p => p?.admin === 'admin' || p?.admin === 'superadmin';
async function isAdmin(sock, chatId, senderId) {
  try {
    const metadata = await sock.groupMetadata(chatId);
    const participants = metadata.participants || [];
    const is = (p, id) => [p.id, p.lid, p.phoneNumber, p.jid].some(value => matches(value, id));
    return {
      isSenderAdmin: participants.some(p => is(p, senderId) && isAdminRole(p)),
      isBotAdmin: participants.some(p => [sock.user?.id, sock.user?.lid].some(id => id && is(p, id)) && isAdminRole(p))
    };
  } catch {
    return { isSenderAdmin: false, isBotAdmin: false };
  }
}
module.exports = isAdmin;
module.exports.matches = matches;
