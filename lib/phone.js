const { parsePhoneNumberFromString } = require('libphonenumber-js');
function normalizePhone(input) {
  const digits = String(input || '').replace(/[٠-٩]/g, d => String('٠١٢٣٤٥٦٧٨٩'.indexOf(d))).replace(/[^0-9]/g, '');
  if (!digits) return '';
  const phone = parsePhoneNumberFromString('+' + digits);
  if (!phone?.isValid()) throw new Error('اكتب رقم واتساب الدولي كاملًا بدون + أو مسافات، مثال لمصر: 201012345678.');
  return phone.number.slice(1);
}
module.exports = { normalizePhone };
