const exact = require('./arabic-strings.json');
const settings = require('../settings');
const state = require('./state-store');

// Exact translations first; phrase rules handle values interpolated by upstream
// commands. URLs, code, identifiers and user-provided media names stay untouched.
const phrases = [
  [/Please mention (?:someone|the user)(?: or reply to their message)?/gi, 'منشن العضو أو رد على رسالته'],
  [/Please reply to (?:an? )?/gi, 'رد على '],
  [/Only (?:the )?bot owner(?: or sudo)? can use this command/gi, 'الأمر ده للمالك أو المساعد المصرّح له فقط'],
  [/Only (?:group )?admins(?: or the bot owner)? can use this command/gi, 'الأمر ده لمشرفي المجموعة فقط'],
  [/Only owner\/sudo can use/gi, 'الأمر للمالك أو المساعد فقط:', ],
  [/This command (?:can only be used|is only available) (?:in|for) (?:group chats|groups)/gi, 'الأمر ده متاح داخل المجموعات فقط'],
  [/Please make the bot an admin(?: first)?/gi, 'ارفع البوت مشرف في المجموعة الأول'],
  [/Failed to download/gi, 'تعذر تنزيل'], [/Failed to fetch/gi, 'تعذر جلب'], [/Failed to generate/gi, 'تعذر إنشاء'],
  [/Failed to create/gi, 'تعذر إنشاء'], [/Failed to update/gi, 'تعذر تحديث'], [/Failed to get/gi, 'تعذر الحصول على'],
  [/Failed to send/gi, 'تعذر إرسال'], [/An error occurred while/gi, 'حصل خطأ أثناء'],
  [/Please try again later/gi, 'جرّب مرة تانية بعد شوية'], [/Please try again/gi, 'جرّب مرة تانية'],
  [/Try again later/gi, 'جرّب لاحقًا'], [/Usage:/gi, 'طريقة الاستخدام:'], [/Example:/gi, 'مثال:'],
  [/Invalid command/gi, 'أمر غير صحيح'], [/Invalid option/gi, 'اختيار غير صحيح'], [/Invalid action/gi, 'إجراء غير صحيح'],
  [/Invalid number/gi, 'رقم غير صحيح'], [/Invalid link/gi, 'رابط غير صحيح'], [/No results found/gi, 'مفيش نتائج'],
  [/No media found/gi, 'مفيش وسائط'], [/No downloadable media found/gi, 'مفيش وسائط قابلة للتنزيل'],
  [/Bot must be admin/gi, 'لازم البوت يكون مشرف'], [/group admins/gi, 'مشرفي المجموعة'],
  [/bot owner/gi, 'مالك البوت'], [/the owner/gi, 'المالك'], [/Owner/g, 'المالك'],
  [/Status:/g, 'الحالة:'], [/Action:/g, 'الإجراء:'], [/Current Status:/g, 'الحالة الحالية:'],
  [/Enabled/g, 'مفعّل'], [/Disabled/g, 'معطّل'], [/ENABLED/g, 'مفعّل'], [/DISABLED/g, 'معطّل'],
  [/already enabled/gi, 'مفعّل بالفعل'], [/already disabled/gi, 'معطّل بالفعل'],
  [/has been enabled/gi, 'تم تفعيله'], [/has been disabled/gi, 'تم تعطيله'],
  [/turned ON/gi, 'تم تفعيله'], [/turned OFF/gi, 'تم تعطيله'],
  [/\bON\b/g, 'مفعّل'], [/\bOFF\b/g, 'معطّل'], [/\bPublic\b/g, 'عام'], [/\bPrivate\b/g, 'خاص'],
  [/\bwarn\b/g, 'تحذير'], [/\bkick\b/g, 'طرد'], [/\bdelete\b/g, 'حذف'],
  [/\bminutes\b/g, 'دقيقة'], [/\bmessages\b/g, 'رسالة'], [/\bwarning\(s\)\b/g, 'تحذير'],
  [/\bUnknown error\b/g, 'خطأ غير معروف'], [/\bUnknown\b/g, 'غير معروف'], [/\bNot set\b/g, 'غير محدد'],
  [/\bDownloading\b/g, 'جاري التنزيل'], [/\bPlease wait\b/g, 'استنى شوية'],
  [/\bGroup name\b/g, 'اسم المجموعة'], [/\bGroup description\b/g, 'وصف المجموعة'],
  [/\bWelcome\b/g, 'أهلًا'], [/\bGoodbye\b/g, 'مع السلامة'],
  [/Knight\s*Bot(?:-?MD)?/gi, settings.botName], [/Mr Unique Hacker/gi, 'فريق التطوير الأصلي']
];
function arabic(value) {
  if (typeof value !== 'string') return value;
  if (exact[value]) return exact[value];
  let output = value;
  for (const [pattern, replacement] of phrases) output = output.replace(pattern, replacement);
  return output;
}
function cleanContent(content) {
  if (!content || typeof content !== 'object') return content;
  const result = { ...content };
  for (const key of ['text', 'caption']) if (typeof result[key] === 'string') result[key] = arabic(result[key]);
  if (result.contextInfo) {
    result.contextInfo = { ...result.contextInfo };
    delete result.contextInfo.forwardedNewsletterMessageInfo;
    // These messages originate here, not from the upstream promotional channel.
    if (result.contextInfo.isForwarded && !result.contextInfo.participant && !result.contextInfo.quotedMessage) {
      delete result.contextInfo.isForwarded;
      delete result.contextInfo.forwardingScore;
    }
  }
  if (Array.isArray(result.buttons)) result.buttons = result.buttons.map(b => ({ ...b, buttonText: { ...b.buttonText, displayText: arabic(b.buttonText?.displayText) } }));
  if (result.poll) result.poll = { ...result.poll, name: arabic(result.poll.name), values: result.poll.values?.map(arabic) };
  for (const key of ['imageMessage', 'videoMessage', 'extendedTextMessage', 'buttonsMessage', 'templateMessage']) {
    if (result[key]) result[key] = cleanContent(result[key]);
  }
  return result;
}
function attachLocalization(sock) {
  const send = sock.sendMessage.bind(sock);
  sock.sendMessage = async (jid, content, options) => {
    try { await state.flush(); }
    catch {
      return send(jid, { text: '❌ تعذر حفظ الإعداد في قاعدة البيانات. التغيير لم يُعتمد؛ راجع اتصال DATABASE_URL وجرّب مرة تانية.' }, options);
    }
    return send(jid, cleanContent(content), options);
  };
  return sock;
}
module.exports = { arabic, cleanContent, attachLocalization };
