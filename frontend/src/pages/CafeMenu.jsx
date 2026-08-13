import { useEffect, useState } from 'react'
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
  const [isLoading, setIsLoading] = useState(false)

  // Lokal geliştirmede ?table=table_01 ile test edilebilir
  // Gerçekte QR /table/:qrCode üzerinden gelir ve store'a kaydeder
  // Ama menüye direkt girilirse ve store boşsa, URL'den al
  useEffect(() => {
    const qrFromUrl = searchParams.get('table')
    if (!table && qrFromUrl) {
      setIsLoading(true)
      api.getTableByQR(qrFromUrl)
        .then(setTable)
        .catch(() => {})
        .finally(() => setIsLoading(false))
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
      {/* Header - Professional */}
      <div style={{ textAlign: 'center', marginBottom: 40 }}>
        {/* Modern Coffee Icon - SVG */}
        <div style={{
          width: 56,
          height: 56,
          margin: '0 auto 16px',
          background: 'rgba(233, 69, 96, 0.1)',
          borderRadius: '50%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}>
          <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ color: 'var(--accent)' }}>
            <path d="M17 8h1a4 4 0 1 1 0 8h-1"/>
            <path d="M3 8h14v9a4 4 0 0 1-4 4H7a4 4 0 0 1-4-4Z"/>
            <line x1="6" y1="1" x2="6" y2="4"/>
            <line x1="10" y1="1" x2="10" y2="4"/>
            <line x1="14" y1="1" x2="14" y2="4"/>
          </svg>
        </div>

        <h1 style={{
          fontSize: 24,
          fontWeight: 800,
          letterSpacing: '-0.5px',
          marginBottom: 4,
          color: 'var(--text)'
        }}>
          Pafta Cafe
        </h1>
        <p style={{
          fontSize: 14,
          color: 'var(--text2)',
          fontWeight: 500,
          marginBottom: 12
        }}>
          Menü
        </p>

        {/* Table Badge - Prominent */}
        {table && (
          <div className="table-badge">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z"/>
              <circle cx="12" cy="10" r="3"/>
            </svg>
            {table.label || `Masa ${table.table_number}`}
          </div>
        )}

        {/* Loading state */}
        {isLoading && (
          <div style={{
            marginTop: 16,
            width: 120,
            height: 24,
            borderRadius: 8
          }} className="skeleton" />
        )}
      </div>

      {/* Menü kategorileri - Improved spacing */}
      {Object.entries(menuItems).map(([category, items]) => (
        <div key={category} style={{ marginBottom: 32 }}>
          {/* Category header with icon */}
          <div className="menu-category">
            {category === 'Sıcak İçecekler' && (
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M17 8h1a4 4 0 1 1 0 8h-1"/>
                <path d="M3 8h14v9a4 4 0 0 1-4 4H7a4 4 0 0 1-4-4Z"/>
              </svg>
            )}
            {category === 'Soğuk İçecekler' && (
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M12 20v-6"/>
                <path d="M8 20v-4"/>
                <path d="M16 20v-4"/>
                <path d="M7 20h10"/>
                <path d="M5.5 16h13"/>
                <path d="M12 4v6"/>
                <path d="m9 7 3-3 3 3"/>
              </svg>
            )}
            {category === 'Atıştırmalık' && (
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="12" cy="12" r="10"/>
                <path d="m16 8-4 4 4 4"/>
                <path d="M8 12h8"/>
              </svg>
            )}
            {category}
          </div>

          {/* Menu card with alternating backgrounds */}
          <div className="menu-card">
            {items.map((item, i) => (
              <div key={item.name} className="menu-item">
                <div className="menu-item-content">
                  <span className="menu-item-name">{item.name}</span>
                </div>
                <span className="menu-item-price">{item.price}</span>
              </div>
            ))}
          </div>
        </div>
      ))}

      {/* Oyunlar butonu - Professional, fixed bottom */}
      <div style={{
        position: 'fixed',
        bottom: 0,
        left: '50%',
        transform: 'translateX(-50%)',
        width: '100%',
        maxWidth: 480,
        padding: 16,
        background: 'linear-gradient(to top, var(--bg) 0%, var(--bg) 60%, transparent)',
        pointerEvents: 'none',
      }}>
        <button
          className="btn-cta"
          onClick={goToGames}
          style={{
            pointerEvents: 'auto',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 10,
          }}
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <rect width="6" height="12" x="2" y="6" rx="1"/>
            <rect width="6" height="12" x="16" y="6" rx="1"/>
            <path d="M12 12h-1a2 2 0 0 0-2 2v2a2 2 0 0 0 2 2h1"/>
          </svg>
          Oyunlara Geç
        </button>
      </div>
    </div>
  )
}
