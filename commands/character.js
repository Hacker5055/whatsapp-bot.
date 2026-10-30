const traits = ['ذكي','مبدع','مصمم','طموح','حنون','كاريزما','واثق','متفهم','نشيط','ودود','كريم','صادق','مرح','خيالي','مستقل','حدسي','طيب','منطقي','وفي','متفائل','شغوف','صبور','مثابر','يعتمد عليه','واسع الحيلة','مخلص','مراعٍ للمشاعر','متفهم','متعدد المهارات','حكيم'];
module.exports = async function characterCommand(sock, chatId, message) {
  const context = message.message?.extendedTextMessage?.contextInfo;
  const target = context?.mentionedJid?.[0] || context?.participant;
  if (!target) return sock.sendMessage(chatId, { text: 'منشن عضو أو رد على رسالته لتحليل شخصيته ترفيهيًا.' }, { quoted: message });
  const selected = [...traits].sort(() => Math.random() - .5).slice(0, 4);
  const text = `🔮 *تحليل الشخصية الترفيهي*\n\n👤 @${target.split('@')[0]}\n\n${selected.map(t => `✨ ${t}: ${60 + Math.floor(Math.random() * 41)}%`).join('\n')}\n\n🎯 التقييم العام: ${80 + Math.floor(Math.random() * 21)}%\n\nده تحليل عشوائي للتسلية، وليس تقييمًا حقيقيًا لشخصيتك.`;
  await sock.sendMessage(chatId, { text, mentions: [target] }, { quoted: message });
};
module.exports.traits = traits;
