const pick = list => list[Math.floor(Math.random() * list.length)];
const items = [
  "أنت زي تحديث التطبيق: بتيجي في أنسب وقت للتعليق. 😄",
  "عندك ثقة-awesome، حتى وإنت بتقفل الصفحة الغلط. 😂",
  "لو الكسل رياضة، هتبقى بطل المجموعة. 😅",
  "واضح إن مخك عامل وضع توفير الطاقة النهاردة. 🔋"
];
async function insultCommand(sock, chatId, message) { let text = pick(items); const target = message?.message?.extendedTextMessage?.contextInfo?.mentionedJid?.[0] || message?.message?.extendedTextMessage?.contextInfo?.participant; if (!target) return sock.sendMessage(chatId, { text: 'منشن عضو للمزاح بدون إساءة.' }, { quoted: message }); text = `@${target.split('@')[0]}، ${text}`; await sock.sendMessage(chatId, { text, mentions: [target] }, { quoted: message });
}
module.exports = { insultCommand, items };
