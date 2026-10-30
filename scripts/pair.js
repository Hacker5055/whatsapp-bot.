#!/usr/bin/env node
require('dotenv').config();
const qrcode = require('qrcode');
const { openConnection } = require('../lib/connection');
const { closeDatabase } = require('../lib/database');
const { normalizePhone } = require('../lib/phone');

async function main() {
  let number;
  try { number = normalizePhone(process.argv[2] || process.env.PAIRING_NUMBER || ''); }
  catch (error) { console.error('❌ ' + error.message); process.exitCode = 1; return; }
  console.log('🔗 ربط Black X بواتساب. أوقف أي نسخة أخرى تستخدم نفس الجلسة أولًا.');
  const connection = await openConnection({
    pairingNumber: number,
    onPairingCode: code => {
      console.log(`\n🔑 كود الربط: ${code}\n`);
      console.log('افتح واتساب ← الإعدادات ← الأجهزة المرتبطة ← ربط جهاز ← الربط برقم الهاتف.');
      console.log('أدخل الكود خلال مدة صلاحيته. لا تشاركه مع أي شخص.\n');
    }
  });
  let timer;
  let finished = false;
  const finish = async code => {
    if (finished) return;
    finished = true;
    clearTimeout(timer);
    await connection.close();
    await closeDatabase();
    process.exitCode = code;
  };
  process.once('SIGINT', () => finish(0));
  process.once('SIGTERM', () => finish(0));
  connection.sock.ev.on('blackx:fatal', () => finish(1));
  connection.sock.ev.on('connection.update', async update => {
    if (update.qr && !number) {
      console.log('📱 امسح رمز QR من واتساب ← الأجهزة المرتبطة ← ربط جهاز:');
      console.log(await qrcode.toString(update.qr, { type: 'terminal', small: true }));
    }
    if (update.connection === 'open' && !finished) {
      // saveCreds is async. Do not disconnect before pending writes complete.
      await new Promise(resolve => setTimeout(resolve, 2000));
      console.log('✅ تم ربط الرقم وحفظ الجلسة. شغّل البوت الآن بالأمر npm start.');
      console.log('على Heroku احذف PAIRING_NUMBER ثم شغّل worker واحدًا فقط.');
      await finish(0);
    }
    if (update.connection === 'close' && !finished) {
      console.error('❌ أُغلق الاتصال قبل إتمام الربط. جرّب مرة أخرى بكود جديد.');
      await finish(1);
    }
  });
  timer = setTimeout(async () => {
    console.error('❌ انتهت مهلة الربط (3 دقايق). أعد الأمر وأدخل كودًا جديدًا.');
    await finish(1);
  }, 180000);
}
main().catch(async error => {
  console.error('❌ ' + error.message);
  await closeDatabase().catch(() => {});
  process.exitCode = 1;
});
