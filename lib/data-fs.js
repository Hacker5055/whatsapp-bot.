// Wrapper around node:fs. Only JSON files under data/ are persisted in DB.
// Commands use a synchronous API inherited from upstream; flush before replies.
const fs = require('node:fs');
const state = require('./state-store');
const adapter = Object.create(fs);
adapter.writeFileSync = function writeFileSync(file, contents, options) {
  if (!state.persist(file, contents)) return fs.writeFileSync(file, contents, options);
};
module.exports = adapter;
