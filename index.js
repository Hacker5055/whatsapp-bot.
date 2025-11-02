import makeWASocket, { useMultiFileAuthState, fetchLatestBaileysVersion } from '@whiskeysockets/baileys'
import qrcode from 'qrcode-terminal'
import fs from 'fs-extra'
import pino from 'pino'

const logger = pino({ level: 'info' })
const SESSION_DIR = './session'
const LINK_REGEX = /(https?:\/\/[^\s]+)/i
const FORBIDDEN_WORDS = ['كلمة1','كلمة2'] // عدل هنا كلماتك المحظورة
async function start() {
  await fs.ensureDir(SESSION_DIR)
  const { state, saveCreds } = await useMultiFileAuthState(SESSION_DIR)
  const { version } = await fetchLatestBaileysVersion().catch(()=>({ version: [2,2303,6] }))

  const sock = makeWASocket({
    auth: state,
    logger,
    version
  })

  // عرض QR في التيرمنال عند الحاجة
  sock.ev.on('connection.update', (upd) => {
    if (upd.qr) qrcode.generate(upd.qr, { small: true })
    if (upd.connection === 'open') console.log('✅ connected')
    if (upd.connection === 'close') console.log('connection closed')
  })

  sock.ev.on('creds.update', saveCreds)

  sock.ev.on('messages.upsert', async (m) => {
    try {
      const msgs = m.messages
      if (!msgs || !msgs.length) return
      const msg = msgs[0]
      if (!msg.message) return
      const jid = msg.key.remoteJid
      // شغل فقط على المجموعات
      if (!jid || !jid.endsWith('@g.us')) return

      // احصل على النص من أماكن متعددة
      let text = ''
      const message = msg.message
      if (message.conversation) text = message.conversation
      else if (message.extendedTextMessage?.text) text = message.extendedTextMessage.text
      else if (message.imageMessage?.caption) text = message.imageMessage.caption
      else if (message.videoMessage?.caption) text = message.videoMessage.caption
      text = String(text || '').trim()

      if (!text) return

      const sender = msg.key.participant || msg.key.remoteJid
      const hasLink = LINK_REGEX.test(text)
      const lowered = text.toLowerCase()
      const hasForbidden = FORBIDDEN_WORDS.some(w => lowered.includes(w.toLowerCase()))

      if (hasLink || hasForbidden) {
        console.log('⚠️ مخالفة من:', sender, 'في المجموعة:', jid, hasLink ? 'رابط' : 'كلمة محظورة')
        try {
          // طرد
          await sock.groupParticipantsUpdate(jid, [sender], 'remove')
          console.log('مُطرد:', sender)
        } catch (e) {
          console.error('فشل الطرد:', e?.message || e)
        }
        try {
          // حظر (اختياري، قد لا يعمل على كل نسخ)
          await sock.updateBlockStatus(sender, 'block')
          console.log('محظور:', sender)
        } catch (e) {
          console.warn('تعذر الحظر:', e?.message || e)
        }
      }
    } catch (err) {
      console.error('خطأ معالجة رسالة:', err)
    }
  })

  return sock
}

start().catch(e => {
  console.error('فشل التشغيل:', e)
})
          
