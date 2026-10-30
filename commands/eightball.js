const responses = [
  "أيوه، بالتأكيد!",
  "مش دلوقتي.",
  "اسأل مرة تانية بعد شوية.",
  "النتيجة مؤكدة.",
  "أشك في ده.",
  "من غير شك.",
  "إجابتي لأ.",
  "المؤشرات بتقول أيوه."
];
module.exports = async function eightBallCommand(sock, chatId, question) { if (!question) return sock.sendMessage(chatId, { text: 'اكتب سؤال الأول!' }); await sock.sendMessage(chatId, { text: '🎱 ' + responses[Math.floor(Math.random() * responses.length)] }); };
module.exports.responses = responses;
