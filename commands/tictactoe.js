const TicTacToe = require('../lib/tictactoe');
const games = new Map();
const symbols = { X: '❎', O: '⭕', 1:'1️⃣',2:'2️⃣',3:'3️⃣',4:'4️⃣',5:'5️⃣',6:'6️⃣',7:'7️⃣',8:'8️⃣',9:'9️⃣' };
const board = game => { const a = game.render().map(v => symbols[v]); return [a.slice(0,3).join(''),a.slice(3,6).join(''),a.slice(6).join('')].join('\n'); };
const findGame = sender => [...games.values()].find(r => [r.game.playerX, r.game.playerO].includes(sender));
async function tictactoeCommand(sock, chatId, senderId, text = '') {
  if (!chatId.endsWith('@g.us')) return sock.sendMessage(chatId, { text: '🎮 لعبة إكس أو متاحة في المجموعات فقط.' });
  const existing = findGame(sender);
  if (existing) return sock.sendMessage(chatId, { text: '❌ لسه عندك لعبة شغالة. اكتب .انسحاب لإنهائها.' });
  let room = [...games.values()].find(r => r.state === 'WAITING' && r.game.playerX !== senderId && (!text || r.name === text));
  if (room) { room.game.playerO = senderId; room.state = 'PLAYING'; }
  else {
    room = { id: String(Date.now()), chatId, name: text, game: new TicTacToe(senderId, ''), state: 'WAITING' };
    games.set(room.id, room);
    return sock.sendMessage(chatId, { text: `⏳ *في انتظار منافس*\n@${senderId.split('@')[0]} بدأ لعبة إكس أو.\nاكتب *.اكس ${text || ''}* للانضمام.`, mentions: [senderId] });
  }
  await sock.sendMessage(chatId, { text: `🎮 *بدأت لعبة إكس أو*\n\n${board(room.game)}\n\nالدور على @${room.game.currentTurn.split('@')[0]}\nاكتب رقم من 1 إلى 9. للانسحاب: .انسحاب`, mentions: [room.game.playerX, room.game.playerO] });
}
async function handleTicTacToeMove(sock, chatId, senderId, text) {
  const room = findGame(senderId);
  if (!room || room.chatId !== chatId || room.state !== 'PLAYING') return;
  const surrender = /^(surrender|انسحاب)$/i.test(text);
  if (!surrender && !/^[1-9١-٩]$/.test(text)) return;
  if (!surrender && room.game.currentTurn !== senderId) return sock.sendMessage(chatId, { text: '❌ مش دورك!' });
  const normalized = String(text).replace(/[١-٩]/g, d => String('١٢٣٤٥٦٧٨٩'.indexOf(d) + 1));
  if (!surrender && room.game.turn(senderId === room.game.playerO, Number(normalized) - 1) !== 1) return sock.sendMessage(chatId, { text: '❌ المكان ده محجوز. اختار مكان تاني.' });
  let winner = surrender ? (senderId === room.game.playerX ? room.game.playerO : room.game.playerX) : room.game.winner;
  const tie = !winner && room.game.turns === 9;
  const status = winner ? `🎉 @${winner.split('@')[0]} كسب${surrender ? ' بسبب انسحاب المنافس' : ''}!` : tie ? '🤝 تعادل!' : `الدور على @${room.game.currentTurn.split('@')[0]}`;
  await sock.sendMessage(chatId, { text: `🎮 *إكس أو*\n\n${status}\n\n${board(room.game)}\n\n❎ @${room.game.playerX.split('@')[0]}\n⭕ @${room.game.playerO.split('@')[0]}`, mentions: [room.game.playerX, room.game.playerO, ...(winner ? [winner] : [])] });
  if (winner || tie) games.delete(room.id);
}
module.exports = { tictactoeCommand, handleTicTacToeMove };
