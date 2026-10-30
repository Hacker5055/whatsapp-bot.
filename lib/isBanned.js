const fs = require('../lib/data-fs');
const { buildComparableIds } = require('./jidHelper');

function isBanned(userId) {
    try {
        const bannedUsers = JSON.parse(fs.readFileSync('./data/banned.json', 'utf8'));
        const ids = buildComparableIds(userId); return bannedUsers.some(jid => buildComparableIds(jid).some(id => ids.includes(id)));
    } catch (error) {
        console.error('Error checking banned status:', error);
        return false;
    }
}

module.exports = { isBanned }; 