const pick = list => list[Math.floor(Math.random() * list.length)];
const items = [
  "لو الابتسامة رسالة، ابتسامتك أجمل إشعار. 😊",
  "وجودك بيخلي الكلام ألطف. 🌷",
  "واضح إنك بتعرف تخلّي يوم حد أحسن. 💚",
  "لو اللطف مسابقة، هتكون من أوائل الفائزين. ✨"
];
async function flirtCommand(sock, chatId, message) { let text = pick(items); await sock.sendMessage(chatId, { text }, { quoted: message });
}
module.exports = { flirtCommand, items };
