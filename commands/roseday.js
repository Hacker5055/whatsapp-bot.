const pick = list => list[Math.floor(Math.random() * list.length)];
const items = [
  "وردة لك، ومعناها إن وجودك محل تقدير. 🌹",
  "أجمل الورد اللي بيوصل من غير مناسبة. 🌷",
  "لك وردة وكلمة طيبة: يومك جميل إن شاء الله. 🌹"
];
async function rosedayCommand(sock, chatId, message) { let text = pick(items); await sock.sendMessage(chatId, { text }, { quoted: message });
}
module.exports = { rosedayCommand, items };
