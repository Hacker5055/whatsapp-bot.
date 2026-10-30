const { randomBytes } = require('node:crypto');
console.log(randomBytes(32).toString('base64'));
console.error('احتفظ بالمفتاح في مكان آمن. أضفه إلى SESSION_ENCRYPTION_KEY ولا ترفعه إلى GitHub.');
