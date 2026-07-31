import { useEffect } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { useStore } from '../lib/store.js'
import { api } from '../lib/api.js'

const menuItems = {
  'Sıcak İçecekler': [
    { name: 'Türk Kahvesi', price: '₺130' },
    { name: 'Americano', price: '₺150' },
    { name: 'Latte', price: '₺170' },
    { name: 'Cappuccino', price: '₺170' },
    { name: 'Türk Çayı', price: '₺70' },
  ],
  'Soğuk İçecekler': [
    { name: 'Ice Latte', price: '₺170' },
    { name: 'Frappe', price: '₺190' },
    { name: 'Limonata', price: '₺120' },
    { name: 'Ice Americano', price: '₺150' },
  ],
  'Atıştırmalık': [
    { name: 'Pafta Tost', price: '₺220' },
    { name: 'Marlenka', price: '₺250' },
    { name: 'Kek', price: '₺70' },
    { name: 'Kurabiye', price: '₺150' },
  ]
}

export default function CafeMenu() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const { table, setTable, session } = useStore()

  // Lokal geliştirmede ?table=table_01 ile test edilebilir
  // Gerçekte QR /table/:qrCode üzerinden gelir ve store'a kaydeder
  // Ama menüye direkt girilirse ve store boşsa, URL'den al
  useEffect(() => {
    const qrFromUrl = searchParams.get('table')
    if (!table && qrFromUrl) {
      api.getTableByQR(qrFromUrl)
        .then(setTable)
        .catch(() => {})
    }
  }, [])

  function goToGames() {
    if (!table) {
      // Masa bilgisi yoksa — QR okutulmamış, dev modunda devam et
      // Gerçek ortamda bu olmamalı ama lokal test için geçici masa ata
      setTable({ id: 'dev-table', table_number: 1, label: 'Geliştirici Masası', qr_code: 'dev' })
    }
    if (session) {
      navigate('/games')
    } else {
      navigate('/nickname')
    }
  }

  return (
    <div className="page fade-in" style={{ paddingBottom: 100 }}>
      {/* Header */}
      <div style={{ textAlign: 'center', marginBottom: 32 }}>
        <div style={{ fontSize: 48, marginBottom: 8 }}>☕</div>
        <h1 style={{ fontSize: 28, fontWeight: 800, letterSpacing: '-0.5px' }}>
          Pafta Cafe Menu
        </h1>
        {table && (
          <span className="badge badge-table" style={{ marginTop: 8, display: 'inline-flex' }}>
            📍 {table.label || `Masa ${table.table_number}`}
          </span>
        )}
      </div>

      {/* Menü kategorileri */}
      {Object.entries(menuItems).map(([category, items]) => (
        <div key={category} style={{ marginBottom: 24 }}>
          <h2 style={{
            fontSize: 13,
            fontWeight: 700,
            color: 'var(--accent)',
            letterSpacing: '2px',
            textTransform: 'uppercase',
            marginBottom: 12
          }}>
            {category}
          </h2>
          <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
            {items.map((item, i) => (
              <div key={item.name} style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                padding: '14px 16px',
                borderBottom: i < items.length - 1 ? '1px solid var(--border)' : 'none'
              }}>
                <span style={{ fontSize: 15 }}>{item.name}</span>
                <span style={{
                  fontFamily: 'Space Mono, monospace',
                  fontSize: 14,
                  color: 'var(--accent2)',
                  fontWeight: 700
                }}>{item.price}</span>
              </div>
            ))}
          </div>
        </div>
      ))}

      {/* Oyunlar butonu - sabit altta */}
      <div style={{
        position: 'fixed',
        bottom: 0,
        left: '50%',
        transform: 'translateX(-50%)',
        width: '100%',
        maxWidth: 480,
        padding: '16px',
        background: 'linear-gradient(to top, var(--bg) 80%, transparent)',
      }}>
        <button className="btn btn-primary" onClick={goToGames} style={{
          background: 'linear-gradient(135deg, var(--accent), #c0392b)',
          fontSize: 18,
          padding: '18px',
          boxShadow: '0 8px 32px rgba(233,69,96,0.4)'
        }}>
          🎮 Oyunları Oyna
        </button>
      </div>
    </div>
  )
}
