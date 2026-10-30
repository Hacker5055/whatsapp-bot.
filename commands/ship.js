module.exports = async function shipCommand(sock, chatId, message) {
  if (!chatId.endsWith('@g.us')) return sock.sendMessage(chatId, { text: 'الأمر ده للمجموعات فقط.' }, { quoted: message });
  try {
    const participants = (await sock.groupMetadata(chatId)).participants.map(p => p.id);
    if (participants.length < 2) return sock.sendMessage(chatId, { text: 'محتاجين عضوين على الأقل.' }, { quoted: message });
    const first = participants[Math.floor(Math.random() * participants.length)];
    const rest = participants.filter(p => p !== first);
    const second = rest[Math.floor(Math.random() * rest.length)];
    await sock.sendMessage(chatId, { text: `💖 *توافق ترفيهي*\n\n@${first.split('@')[0]} ❤️ @${second.split('@')[0]}\nنسبة التوافق: ${Math.floor(Math.random() * 101)}%\n\nده مجرد مزاح ومش تقييم حقيقي للعلاقات!`, mentions: [first, second] }, { quoted: message });
  } catch { await sock.sendMessage(chatId, { text: '❌ تعذر حساب التوافق. جرّب تاني.' }, { quoted: message }); }
};
