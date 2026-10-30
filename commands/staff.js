module.exports = async function staffCommand(sock, chatId, message) {
  if (!chatId.endsWith('@g.us')) return sock.sendMessage(chatId, { text: '👥 الأمر ده للمجموعات فقط.' }, { quoted: message });
  try {
    const group = await sock.groupMetadata(chatId);
    const admins = group.participants.filter(p => p.admin);
    const text = `👑 *مشرفو ${group.subject}*\n\n${admins.map((p, i) => `${i + 1}. @${p.id.split('@')[0]}${p.admin === 'superadmin' ? ' — المالك' : ''}`).join('\n') || 'مفيش مشرفين'}`;
    await sock.sendMessage(chatId, { text, mentions: admins.map(p => p.id) }, { quoted: message });
  } catch { await sock.sendMessage(chatId, { text: '❌ تعذر جلب قائمة المشرفين.' }, { quoted: message }); }
};
