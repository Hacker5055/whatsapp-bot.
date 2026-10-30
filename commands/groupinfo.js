module.exports = async function groupInfoCommand(sock, chatId, message) {
  if (!chatId.endsWith('@g.us')) return sock.sendMessage(chatId, { text: '👥 الأمر ده للمجموعات فقط.' }, { quoted: message });
  try {
    const group = await sock.groupMetadata(chatId);
    const admins = group.participants.filter(p => p.admin);
    const owner = group.owner || admins.find(p => p.admin === 'superadmin')?.id;
    const text = `👥 *معلومات المجموعة*\n\nالاسم: ${group.subject}\nعدد الأعضاء: ${group.participants.length}\nعدد المشرفين: ${admins.length}\n${owner ? `المالك: @${owner.split('@')[0]}\n` : ''}\n*المشرفون:*\n${admins.map((p, i) => `${i + 1}. @${p.id.split('@')[0]}`).join('\n')}\n\n*الوصف:*\n${group.desc || 'مفيش وصف متاح'}`;
    const mentions = [...admins.map(p => p.id), ...(owner ? [owner] : [])];
    try {
      const url = await sock.profilePictureUrl(chatId, 'image');
      await sock.sendMessage(chatId, { image: { url }, caption: text, mentions }, { quoted: message });
    } catch { await sock.sendMessage(chatId, { text, mentions }, { quoted: message }); }
  } catch { await sock.sendMessage(chatId, { text: '❌ تعذر جلب معلومات المجموعة. راجع صلاحيات البوت.' }, { quoted: message }); }
};
