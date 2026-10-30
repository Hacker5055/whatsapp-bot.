const questions = [
  { question: 'إيه أكبر كوكب في المجموعة الشمسية؟', options: ['الأرض', 'المشتري', 'زحل', 'المريخ'], answer: 'المشتري' },
  { question: 'كم عدد أضلاع المثلث؟', options: ['3', '4', '5', '6'], answer: '3' },
  { question: 'إيه عاصمة مصر؟', options: ['الإسكندرية', 'الجيزة', 'القاهرة', 'أسوان'], answer: 'القاهرة' },
  { question: 'إيه العضو اللي بيضخ الدم في جسم الإنسان؟', options: ['الرئة', 'القلب', 'الكبد', 'المعدة'], answer: 'القلب' },
  { question: 'كم عدد قارات العالم؟', options: ['5', '6', '7', '8'], answer: '7' },
  { question: 'إيه أكبر محيط على الأرض؟', options: ['الأطلنطي', 'الهندي', 'المتجمد الشمالي', 'الهادئ'], answer: 'الهادئ' },
  { question: 'الماء بيتكون من أكسجين وإيه؟', options: ['هيدروجين', 'حديد', 'نيتروجين', 'كربون'], answer: 'هيدروجين' },
  { question: 'كم دقيقة في الساعة؟', options: ['30', '60', '90', '100'], answer: '60' }
];
const games = new Map();
const normalize = text => String(text).trim().replace(/[٠-٩]/g, d => String('٠١٢٣٤٥٦٧٨٩'.indexOf(d))).replace(/[أإآ]/g, 'ا').replace(/ة/g, 'ه').toLowerCase();
async function startTrivia(sock, chatId) {
  if (games.has(chatId)) return sock.sendMessage(chatId, { text: 'فيه سؤال شغال بالفعل. جاوب بـ .اجابة إجابتك' });
  const q = questions[Math.floor(Math.random() * questions.length)];
  games.set(chatId, q);
  await sock.sendMessage(chatId, { text: `🧠 *سؤال ومعلومة*\n\n${q.question}\n\n${q.options.map((o, i) => `${i + 1}. ${o}`).join('\n')}\n\nاكتب .اجابة متبوعًا بالإجابة أو رقمها.` });
}
async function answerTrivia(sock, chatId, answer) {
  const q = games.get(chatId);
  if (!q) return sock.sendMessage(chatId, { text: 'مفيش سؤال شغال. ابدأ بـ .سؤال' });
  const index = Number(normalize(answer)) - 1;
  const given = index >= 0 && index < q.options.length ? q.options[index] : answer;
  const correct = normalize(given) === normalize(q.answer);
  games.delete(chatId);
  await sock.sendMessage(chatId, { text: `${correct ? '🎉 إجابة صحيحة!' : '❌ إجابة غير صحيحة.'} الإجابة هي: ${q.answer}` });
}
module.exports = { startTrivia, answerTrivia, questions };
