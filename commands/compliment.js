const items = ['وجودك بيخلّي اليوم أحسن!','روحك جميلة.','ابتسامتك بتنوّر المكان.','عندك حس دعابة رائع.','أنت صديق حقيقي.','كرمك ملوش حدود.','طموحك بيلهم اللي حواليك.','بتعرف تسمع الناس باهتمام.','كلامك الطيب بيفرق.','عندك طاقة إيجابية جميلة.'];
async function complimentCommand(sock, chatId, message) {
  const c = message.message?.extendedTextMessage?.contextInfo;
  const target = c?.mentionedJid?.[0] || c?.participant;
  if (!target) return sock.sendMessage(chatId, { text: 'منشن عضو أو رد على رسالته عشان تمدحه!' }, { quoted: message });
  await sock.sendMessage(chatId, { text: `@${target.split('@')[0]}، ${items[Math.floor(Math.random() * items.length)]}`, mentions: [target] }, { quoted: message });
}
module.exports = { complimentCommand, items };
