const pick = list => list[Math.floor(Math.random() * list.length)];
const items = [
  "إيه أكتر موقف محرج افتكرته فجأة النهاردة؟",
  "مين الشخص اللي كلامه بيفرق معاك؟",
  "إيه عادة نفسك تغيّرها في نفسك؟",
  "إيه حاجة كنت فاكرها صح وطلعت غلط؟",
  "لو هتعتذر لحد، مين هيكون؟",
  "إيه أكتر حاجة بتخليك تثق في شخص؟"
];
async function truthCommand(sock, chatId, message) { let text = pick(items); await sock.sendMessage(chatId, { text }, { quoted: message });
}
module.exports = { truthCommand, items };
