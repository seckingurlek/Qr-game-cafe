/**
 * QR Code Service
 * QR kod görselleri oluşturur ve kaydeder
 */

import QRCode from 'qrcode'
import { promises as fs } from 'fs'
import path from 'path'
import { exec } from 'child_process'
import { promisify } from 'util'
import { networkInterfaces } from 'os'

const execAsync = promisify(exec)
// Backend /app klasöründe çalışıyor
const QR_DIR = path.join(process.cwd(), 'qr-codes')
const SCRIPTS_QR_DIR = path.join(process.cwd(), '../scripts/qr-codes')

/**
 * Yerel IP adresini otomatik olarak al
 * @returns {string|null} - Yerel IP adresi veya null
 */
function getLocalIP() {
  try {
    const nets = networkInterfaces()
    for (const name of Object.keys(nets)) {
      for (const net of nets[name]) {
        // IPv4 ve değil internal (localhost) olanı al
        if (net.family === 'IPv4' && !net.internal) {
          return net.address
        }
      }
    }
    return null
  } catch (err) {
    console.log('⚠️ Yerel IP alınamadı:', err.message)
    return null
  }
}

// Frontend URL - QR kodlar için
// 1. Önce ortam değişkenine bak
// 2. Yoksa yerel IP'yi kullan (port 5173)
// 3. Onun da yoksa localhost kullan
let FRONTEND_URL = process.env.FRONTEND_URL

if (!FRONTEND_URL) {
  const localIP = getLocalIP()
  if (localIP) {
    FRONTEND_URL = `http://${localIP}:5173`
    console.log(`🌐 Otomatik IP algılandı: ${FRONTEND_URL}`)
  } else {
    FRONTEND_URL = 'http://localhost:5173'
    console.log('⚠️ Yerel IP bulunamadı, localhost kullanılıyor')
  }
}

// QR kod klasörünün var olduğundan emin ol
export async function ensureQRDir() {
  await fs.mkdir(SCRIPTS_QR_DIR, { recursive: true })
}

/**
 * QR kod görseli oluştur ve kaydet
 * @param {string} qrCode - QR kod içeriği (örn: "table_01")
 * @returns {Promise<string>} - Dosya yolu
 */
export async function generateQRCode(qrCode) {
  const filename = `${qrCode}.png`
  const filepath = path.join(SCRIPTS_QR_DIR, filename)

  // QR kod içeriği olarak tam URL kullan
  const qrUrl = `${FRONTEND_URL}/table/${qrCode}`

  console.log(`🔄 QR kod oluşturuluyor: ${qrCode}`)
  console.log(`📍 QR URL: ${qrUrl}`)
  console.log(`💾 Kayıt yeri: ${filepath}`)

  // Klasör yoksa oluştur
  await fs.mkdir(SCRIPTS_QR_DIR, { recursive: true })

  // QR kod oluştur ve PNG olarak kaydet
  await QRCode.toFile(filepath, qrUrl, {
    width: 300,
    margin: 2,
    color: {
      dark: '#000000',
      light: '#FFFFFF'
    }
  })

  console.log(`✅ QR kod oluşturuldu: ${filepath}`)

  return `/qr-codes/${filename}`
}

/**
 * QR kod görselini sil
 * @param {string} qrCode - QR kod içeriği
 */
export async function deleteQRCode(qrCode) {
  const filename = `${qrCode}.png`
  const filepath = path.join(SCRIPTS_QR_DIR, filename)

  console.log(`🗑️ QR kod siliniyor: ${filepath}`)

  try {
    await fs.unlink(filepath)
    console.log(`✅ QR kod silindi: ${filepath}`)
  } catch (err) {
    if (err.code === 'ENOENT') {
      console.log(`⚠️ QR kod zaten yok: ${filepath}`)
    } else {
      throw err
    }
  }

  return true
}

/**
 * QR kod var mı kontrol et
 */
export async function qrCodeExists(qrCode) {
  const filename = `${qrCode}.png`
  const filepath = path.join(SCRIPTS_QR_DIR, filename)

  try {
    await fs.access(filepath)
    return true
  } catch {
    return false
  }
}
