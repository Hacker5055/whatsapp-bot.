const pick = list => list[Math.floor(Math.random() * list.length)];
const items = [
  "مش لازم تكون أسرع من الجميع؛ يكفي إنك تواصل خطواتك. 🌱",
  "النجاح بيبدأ لما تحاول مرة كمان بعد ما تتعب.",
  "الكلمة الطيبة صدقة، حتى في رسالة قصيرة. 💚",
  "خُد من كل يوم حاجة تتعلمها، وسيب له حاجة تمتنك.",
  "الطريق الطويل بيبدأ بخطوة صغيرة ثابتة."
];
async function quoteCommand(sock, chatId, message) { let text = pick(items); await sock.sendMessage(chatId, { text }, { quoted: message });
}
module.exports = quoteCommand;
module.exports.items = items;
