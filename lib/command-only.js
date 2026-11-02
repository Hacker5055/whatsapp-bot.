// Outbound fail-closed guard: only command-triggered work may send WhatsApp messages.
const { AsyncLocalStorage } = require('node:async_hooks');
const context = new AsyncLocalStorage();
function runCommand(fn) { return context.run(true, fn); }
function protect(sock) {
  const send = sock.sendMessage.bind(sock);
  sock.sendMessage = (jid, ...args) => context.getStore() === true ? send(jid, ...args) : Promise.resolve(undefined);
}
module.exports = { runCommand, protect };
