const words = ['واتساب', 'برمجة', 'القاهرة', 'كمبيوتر', 'صداقة', 'مدرسة', 'مكتبة', 'تكنولوجيا', 'شمس', 'قمر'];
const games = new Map();
async function startHangman(sock, chatId) {
  const word = words[Math.floor(Math.random() * words.length)];
  const letters = [...word];
  games.set(chatId, { letters, guessed: new Set(), wrong: 0 });
  await sock.sendMessage(chatId, { text: `🎮 *لعبة تخمين الكلمة*\n\n${letters.map(() => '_').join(' ')}\n\nعندك 6 محاولات خاطئة. ابعت .حرف متبوعًا بحرف عربي.` });
}
async function guessLetter(sock, chatId, raw) {
  const game = games.get(chatId);
  if (!game) return sock.sendMessage(chatId, { text: 'مفيش لعبة شغالة. ابدأ بـ .خمن' });
  const letter = String(raw || '').trim().replace(/[أإآ]/g, 'ا').replace(/ة/g, 'ه').replace(/ى/g, 'ي');
  if (!/^[\u0621-\u064a]$/.test(letter)) return sock.sendMessage(chatId, { text: 'اكتب حرف عربي واحد بعد .حرف' });
  if (game.guessed.has(letter)) return sock.sendMessage(chatId, { text: 'جرّبت الحرف ده قبل كده. اختار حرف تاني.' });
  game.guessed.add(letter);
  const normalized = game.letters.map(l => l.replace(/[أإآ]/g, 'ا').replace(/ة/g, 'ه').replace(/ى/g, 'ي'));
  if (!normalized.includes(letter)) game.wrong++;
  const mask = game.letters.map((l, i) => normalized[i] === letter || game.guessed.has(normalized[i]) ? l : '_').join(' ');
  if (!mask.includes('_')) { games.delete(chatId); return sock.sendMessage(chatId, { text: `🎉 مبروك! الكلمة هي: ${game.letters.join('')}` }); }
  if (game.wrong >= 6) { games.delete(chatId); return sock.sendMessage(chatId, { text: `انتهت المحاولات! الكلمة كانت: ${game.letters.join('')}` }); }
  await sock.sendMessage(chatId, { text: `${game.wrong ? '❌ tentativa' : '✅ تخمين صحيح'}\n${mask}\nالمحاولات المتبقية: ${6 - game.wrong}`.replace('tentativa', 'محاولة غير صحيحة') });
}
module.exports = { startHangman, guessLetter, words };
