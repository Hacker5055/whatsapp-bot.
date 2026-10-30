const pick = list => list[Math.floor(Math.random() * list.length)];
const items = [
  "ابعت رسالة شكر لشخص ساعدك قريب.",
  "قول نكتة خفيفة في رسالة واحدة.",
  "اكتب وصف يومك باستخدام 3 إيموجي بس.",
  "امدح عضو في المجموعة بدون مبالغة.",
  "احكي عن مهارة نفسك تتعلمها.",
  "غيّر حالة واتساب لحكمة مفيدة لمدة ساعة لو مناسب ليك."
];
async function dareCommand(sock, chatId, message) { let text = pick(items); await sock.sendMessage(chatId, { text }, { quoted: message });
}
module.exports = { dareCommand, items };
