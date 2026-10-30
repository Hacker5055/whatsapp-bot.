const pick = list => list[Math.floor(Math.random() * list.length)];
const items = [
  "العسل قد يبقى صالحًا لفترات طويلة جدًا إذا اتخزن في وعاء محكم ونظيف. 🍯",
  "الأخطبوط عنده ثلاثة قلوب. 🐙",
  "الضوء بيستغرق حوالي 8 دقايق و20 ثانية عشان يوصل من الشمس للأرض. ☀️",
  "قلب الجمبري موجود في منطقة الرأس. 🦐",
  "الزهرة هو كوكب له اليوم أطول من سنته. 🪐"
];
async function factCommand(sock, chatId, message) { let text = pick(items); await sock.sendMessage(chatId, { text }, { quoted: message });
}
module.exports = factCommand;
module.exports.items = items;
