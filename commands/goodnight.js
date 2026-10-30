const pick = list => list[Math.floor(Math.random() * list.length)];
const items = [
  "تصبح على خير وأحلام هادية. 🌙",
  "سيب تعب اليوم يعدّي، وبكرة بداية جديدة. 💚",
  "نتمنى لك نوم مريح ويوم أجمل. ✨"
];
async function goodnightCommand(sock, chatId, message) { let text = pick(items); await sock.sendMessage(chatId, { text }, { quoted: message });
}
module.exports = { goodnightCommand, items };
