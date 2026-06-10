// scripts/generate-qr.js
// Kullanım: node scripts/generate-qr.js
// Tüm masaların QR kodlarını /scripts/qr-codes/ klasörüne PNG olarak üretir

import QRCode from 'qrcode'
import fs from 'fs'
import path from 'path'

const BASE_URL = process.env.BASE_URL || 'http://localhost:5173'
const TABLE_COUNT = 10
const OUTPUT_DIR = './scripts/qr-codes'

fs.mkdirSync(OUTPUT_DIR, { recursive: true })

for (let i = 1; i <= TABLE_COUNT; i++) {
  const tableCode = `table_${String(i).padStart(2, '0')}`
  const url = `${BASE_URL}/table/${tableCode}`

  await QRCode.toFile(
    path.join(OUTPUT_DIR, `${tableCode}.png`),
    url,
    {
      width: 400,
      margin: 2,
      color: {
        dark: '#0f0f1a',
        light: '#ffffff'
      }
    }
  )

  console.log(`✅ Masa ${i}: ${url} → ${tableCode}.png`)
}

console.log(`\n🎉 ${TABLE_COUNT} adet QR kod ${OUTPUT_DIR} klasörüne kaydedildi.`)
