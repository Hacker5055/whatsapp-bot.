// Shared with the persistent Signal key store; no ephemeral LID mapping files.
const mappings = new Map();
function remember(type, id, value) {
  if (type === 'lid-mapping') {
    if (value == null) mappings.delete(id);
    else mappings.set(id, String(value));
  }
}
function lookup(user, direction) {
  return mappings.get(direction === 'lidToPn' ? `${user}_reverse` : user) || null;
}
module.exports = { remember, lookup };
