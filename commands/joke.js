const pick = list => list[Math.floor(Math.random() * list.length)];
const items = [
  "واحد اشترى ساعة حيطة، قالوله دي ضد المية. قالهمطبّقها وأنا نازل الحمام ليه؟ 😂",
  "واحد بخيل اشترى مروحة، كتب عليها: تدور على قد الهوا. 😄",
  "سألوا الكمبيوتر: مالك ساكت؟ قال: عندي فيروس برد. 🤧",
  "واحد راح يكشف نظر، الدكتور قالهاقرأ السطر الأخير. قالههو أنا داخل امتحان؟ 😂",
  "مفيش حاجة بتنام بدري زي باقة الإنترنت. 😅"
];
async function jokeCommand(sock, chatId, message) { let text = pick(items); await sock.sendMessage(chatId, { text }, { quoted: message });
}
module.exports = jokeCommand;
module.exports.items = items;
