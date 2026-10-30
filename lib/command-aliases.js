// Arabic commands are first-class aliases. Arguments keep their original casing.
const aliases = {
  'اوامر': 'help', 'الأوامر': 'help', 'الاوامر': 'help', 'مساعدة': 'help', 'المساعدة': 'help', 'قائمة': 'help', 'القائمة': 'help', 'القائمه': 'help',
  'سرعة': 'ping', 'بنج': 'ping', 'حالة': 'alive', 'الحالة': 'alive', 'شغال': 'alive', 'مالك': 'owner', 'المالك': 'owner', 'مطور': 'owner',
  'ذكاء': 'ai', 'الذكاء': 'ai', 'اسأل': 'ai', 'بوت': 'chatbot', 'محادثة': 'chatbot', 'تخيل': 'imagine', 'ارسم': 'imagine',
  'ملصق': 'sticker', 'ستيكر': 'sticker', 'صورة': 'simage', 'قص': 'crop', 'دمج': 'emojimix', 'وضوح': 'remini', 'خلفية': 'removebg', 'ضباب': 'blur',
  'نطق': 'tts', 'ترجم': 'translate', 'ترجمة': 'translate', 'طقس': 'weather', 'الطقس': 'weather', 'أخبار': 'news', 'اخبار': 'news', 'نكتة': 'joke', 'حكمة': 'quote', 'معلومة': 'fact',
  'طرد': 'kick', 'حظر': 'ban', 'رفع_الحظر': 'unban', 'ترقية': 'promote', 'خفض': 'demote', 'كتم': 'mute', 'فتح': 'unmute', 'حذف': 'delete', 'مسح': 'clear',
  'تحذير': 'warn', 'تحذيرات': 'warnings', 'منع_الروابط': 'antilink', 'منع_الشتائم': 'antibadword', 'منع_البوتات': 'antibot', 'منع_المنشن': 'antitag',
  'ترحيب': 'welcome', 'وداع': 'goodbye', 'منشن_الكل': 'tagall', 'منشن': 'tag', 'منشن_خفي': 'hidetag', 'الاعضاء': 'topmembers', 'المشرفين': 'staff', 'مشرفين': 'staff',
  'معلومات_المجموعة': 'groupinfo', 'رابط_جديد': 'resetlink', 'اسم_المجموعة': 'setgname', 'وصف_المجموعة': 'setgdesc', 'صورة_المجموعة': 'setgpp', 'صورة_البوت': 'setpp',
  'وضع': 'mode', 'الوضع': 'mode', 'اعدادات': 'settings', 'الإعدادات': 'settings', 'الاعدادات': 'settings', 'قراءة': 'autoread', 'كتابة': 'autotyping', 'تفاعل': 'areact',
  'منع_المكالمات': 'anticall', 'منع_الخاص': 'pmblocker', 'الحالات': 'autostatus', 'حفظ_الحالة': 'savestatus', 'مكافحة_الحذف': 'antidelete', 'المشرفين_المساعدين': 'sudo',
  'اغنية': 'song', 'أغنية': 'song', 'شغل': 'play', 'فيديو': 'video', 'انستا': 'instagram', 'انستقرام': 'instagram', 'فيسبوك': 'facebook', 'تيك_توك': 'tiktok', 'تحميل': 'play',
  'كلمات': 'lyrics', 'تويت': 'twitter', 'رابط_الملف': 'url', 'لقطة': 'ss', 'مرة_واحدة': 'vv', 'المستودع': 'github', 'تحديث': 'update', 'ربط': 'pair',
  'لعبة': 'tictactoe', 'اكس': 'tictactoe', 'خمن': 'hangman', 'حرف': 'guess', 'سؤال': 'trivia', 'اجابة': 'answer', 'إجابة': 'answer', 'انسحاب': 'surrender',
  'صراحة': 'truth', 'جرأة': 'dare', 'كرة': '8ball', 'مدح': 'compliment', 'شخصية': 'character', 'توافق': 'ship', 'تصبحون_خير': 'goodnight', 'شعر': 'shayari', 'وردة': 'roseday', 'غزل': 'flirt', 'مزاح': 'insult'
};
const options = {
  'تشغيل': 'on', 'تفعيل': 'on', 'ايقاف': 'off', 'إيقاف': 'off', 'تعطيل': 'off', 'عام': 'public', 'خاص': 'private',
  'حذف': 'delete', 'طرد': 'kick', 'تحذير': 'warn', 'اضافة': 'add', 'إضافة': 'add', 'إزالة': 'del', 'ازالة': 'del', 'قائمة': 'list', 'رسالة': 'setmsg', 'تعيين': 'set', 'وضع_الرد': 'set'
};
function normalizeCommand(text) {
  const raw = String(text || '').trim();
  if (!raw.startsWith('.')) return raw;
  const match = raw.slice(1).match(/^(\S+)([\s\S]*)$/);
  if (!match) return raw;
  const command = aliases[match[1]] || match[1].toLowerCase();
  let args = match[2].trim();
  // Translate option words only, never a welcome message, AI prompt or URL.
  if (/^(welcome|goodbye|antilink|antibadword|antibot|antitag|chatbot|mode|autoread|autotyping|areact|anticall|pmblocker|autostatus|savestatus|antidelete|sudo|mention)$/.test(command)) {
    const parts = args.split(/\s+/);
    // Only action words are translated: never touch custom messages or numbers.
    const safeCount = parts[0] === 'set' || parts[0] === 'تعيين' ? 2 : 1;
    args = parts.map((word, index) => index < safeCount ? (options[word] || word) : word).join(' ');
  }
  return '.' + command + (args ? ' ' + args : '');
}
module.exports = { aliases, options, normalizeCommand };
