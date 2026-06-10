import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { api } from '../lib/api.js'

const GAME_LABELS = {
  snake: { name: 'Snake', emoji: '🐍' },
  '2048': { name: '2048', emoji: '🔢' },
  flappy: { name: 'Flappy Bird', emoji: '🐦' },
  wordle: { name: 'Wordle', emoji: '📝' },
  tictactoe: { name: 'Tic-Tac-Toe', emoji: '⭕' },
  chess: { name: 'Satranç', emoji: '♟️' },
}

export default function Leaderboard() {
  const { gameSlug } = useParams()
  const navigate = useNavigate()
  const [data, setData] = useState({})
  const [selected, setSelected] = useState(gameSlug || 'snake')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    api.getAllLeaderboards()
      .then(setData)
      .finally(() => setLoading(false))
  }, [])

  const rows = data[selected] || []

  return (
    <div className="page fade-in">
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 24 }}>
        <button onClick={() => navigate('/games')} style={{
          background: 'none', border: 'none', color: 'var(--text2)', cursor: 'pointer', fontSize: 20
        }}>←</button>
        <h1 style={{ fontSize: 22, fontWeight: 800 }}>🏆 Skor Tablosu</h1>
      </div>

      {/* Oyun seçimi */}
      <div style={{ display: 'flex', gap: 8, overflowX: 'auto', paddingBottom: 8, marginBottom: 24 }}>
        {Object.entries(GAME_LABELS).map(([slug, info]) => (
          <button
            key={slug}
            onClick={() => setSelected(slug)}
            style={{
              background: selected === slug ? 'var(--accent)' : 'var(--bg2)',
              border: `1px solid ${selected === slug ? 'var(--accent)' : 'var(--border)'}`,
              color: selected === slug ? 'white' : 'var(--text2)',
              borderRadius: 20,
              padding: '6px 14px',
              fontFamily: 'Syne',
              fontWeight: 700,
              fontSize: 13,
              cursor: 'pointer',
              whiteSpace: 'nowrap',
              transition: 'all 0.2s'
            }}
          >
            {info.emoji} {info.name}
          </button>
        ))}
      </div>

      {/* Tablo */}
      {loading ? (
        <div style={{ textAlign: 'center', color: 'var(--text2)', padding: 32 }}>Yükleniyor...</div>
      ) : rows.length === 0 ? (
        <div className="card" style={{ textAlign: 'center', padding: 40 }}>
          <div style={{ fontSize: 40, marginBottom: 8 }}>🎯</div>
          <p style={{ color: 'var(--text2)' }}>Henüz skor yok. İlk oynayan sen ol!</p>
        </div>
      ) : (
        <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
          {rows.map((row, i) => (
            <div key={i} style={{
              display: 'flex',
              alignItems: 'center',
              gap: 12,
              padding: '14px 16px',
              borderBottom: i < rows.length - 1 ? '1px solid var(--border)' : 'none',
              background: i === 0 ? 'rgba(245,166,35,0.08)' : 'transparent'
            }}>
              <span style={{
                fontFamily: 'Space Mono',
                fontWeight: 700,
                fontSize: 14,
                color: i === 0 ? '#f5a623' : i === 1 ? '#aaaaaa' : i === 2 ? '#cd7f32' : 'var(--text2)',
                minWidth: 24,
                textAlign: 'center'
              }}>
                {i === 0 ? '🥇' : i === 1 ? '🥈' : i === 2 ? '🥉' : `${i + 1}.`}
              </span>
              <div style={{ flex: 1 }}>
                <div style={{ fontWeight: 700, fontSize: 15 }}>{row.nickname}</div>
                <div style={{ fontSize: 12, color: 'var(--text2)' }}>📍 Masa {row.table_number}</div>
              </div>
              <span style={{
                fontFamily: 'Space Mono',
                fontWeight: 700,
                fontSize: 16,
                color: 'var(--accent2)'
              }}>
                {row.best_score}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
