const pick = list => list[Math.floor(Math.random() * list.length)];
const items = [
  "في زحمة الأيام وصوت المسافات، تفضل كلمة حلوة زي المطر. 🌧️",
  "مش كل كلام بيتقال، بعض الصحبة بتتفهم من غير كلام. 🌷",
  "خلّي الأمل قريب، والبسمة رفيقة دربك. ✨"
];
async function shayariCommand(sock, chatId, message) { let text = pick(items); await sock.sendMessage(chatId, { text }, { quoted: message });
}
module.exports = { shayariCommand, items };
