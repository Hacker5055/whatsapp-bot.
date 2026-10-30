const { addWelcome, delWelcome, isWelcomeOn, addGoodbye, delGoodBye, isGoodByeOn } = require('./index');
async function configure(sock, chatId, message, match, farewell = false) {
  const label = farewell ? 'الوداع' : 'الترحيب';
  const command = farewell ? 'وداع' : 'ترحيب';
  const reply = text => sock.sendMessage(chatId, { text }, { quoted: message });
  const [action, ...rest] = String(match || '').trim().split(/\s+/);
  if (!action) return reply(`📥 *إعداد ${label}*\n\n.${command} تشغيل\n.${command} ايقاف\n.${command} تعيين رسالتك\n\nالمتغيرات: {user} العضو، {group} اسم المجموعة${farewell ? '' : '، {description} الوصف'}`);
  const enabled = farewell ? await isGoodByeOn(chatId) : await isWelcomeOn(chatId);
  if (action === 'on') {
    await (farewell ? addGoodbye(chatId, true, 'مع السلامة {user} 👋') : addWelcome(chatId, true, 'أهلًا {user} في {group}! 🎉'));
    return reply(`✅ تم تفعيل ${label}. غيّر الرسالة بـ .${command} تعيين رسالتك`);
  }
  if (action === 'off') {
    await (farewell ? delGoodBye(chatId) : delWelcome(chatId));
    return reply(`✅ تم تعطيل ${label}.`);
  }
  const text = rest.join(' ').trim();
  if (action === 'set' && text) {
    await (farewell ? addGoodbye(chatId, enabled, text) : addWelcome(chatId, enabled, text));
    return reply(`✅ تم حفظ رسالة ${label}.`);
  }
  return reply(`❌ اختيار غير صحيح. اكتب .${command} لعرض الاستخدام.`);
}
module.exports = {
  handleWelcome: (sock, chatId, message, match) => configure(sock, chatId, message, match),
  handleGoodbye: (sock, chatId, message, match) => configure(sock, chatId, message, match, true)
};
