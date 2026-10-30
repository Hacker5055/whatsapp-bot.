const settings = require('../settings');
module.exports = async function ownerCommand(sock, chatId) {
  if (!settings.ownerNumber) return sock.sendMessage(chatId, { text: `👤 مالك ${settings.botName}\n${settings.botOwner}\n\nلم يُضبط OWNER_NUMBER بعد. أضفه في الإعدادات الخاصة.` });
  const vcard = `BEGIN:VCARD\nVERSION:3.0\nFN:${settings.botOwner}\nTEL;waid=${settings.ownerNumber}:${settings.ownerNumber}\nEND:VCARD`;
  await sock.sendMessage(chatId, { contacts: { displayName: settings.botOwner, contacts: [{ vcard }] } });
};
