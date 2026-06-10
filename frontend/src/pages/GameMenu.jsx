import { useNavigate } from 'react-router-dom'
import { useStore } from '../lib/store.js'

const GAMES = [
  {
    slug: 'snake',
    name: 'Snake',
    emoji: '🐍',
    desc: 'Klasik yılan oyunu',
    type: 'solo',
    color: '#27ae60',
    path: '/play/snake'
  },
  {
    slug: '2048',
    name: '2048',
    emoji: '🔢',
    desc: 'Sayıları birleştir',
    type: 'solo',
    color: '#e67e22',
    path: '/play/2048'
  },
  {
    slug: 'flappy',
    name: 'Flappy Bird',
    emoji: '🐦',
    desc: 'Engelleri aş',
    type: 'solo',
    color: '#3498db',
    path: '/play/flappy'
  },
  {
    slug: 'wordle',
    name: 'Wordle TR',
    emoji: '📝',
    desc: '6 tahminle kelimeyi bul',
    type: 'solo',
    color: '#9b59b6',
    path: '/play/wordle'
  },
  {
    slug: 'tictactoe',
    name: 'Tic-Tac-Toe',
    emoji: '⭕',
    desc: 'Çok oyunculu - farklı masalar',
    type: 'multi',
    color: '#e94560',
    path: '/lobby/tictactoe'
  },
  {
    slug: 'chess',
    name: 'Satranç',
    emoji: '♟️',
    desc: 'Çok oyunculu - farklı masalar',
    type: 'multi',
    color: '#f5a623',
    path: '/lobby/chess'
  },
]

export default function GameMenu() {
  const navigate = useNavigate()
  const session = useStore(s => s.session)

  if (!session) {
    return (
      <div className="page" style={{ justifyContent: 'center', alignItems: 'center', gap: 16 }}>
        <div style={{ fontSize: 48 }}>🎮</div>
        <p style={{ color: 'var(--text2)' }}>Önce bir nick girin</p>
        <button className="btn btn-primary" onClick={() => navigate('/nickname')}
          style={{ width: 'auto', padding: '12px 32px' }}>
          Nick Gir
        </button>
      </div>
    )
  }

  const soloGames = GAMES.filter(g => g.type === 'solo')
  const multiGames = GAMES.filter(g => g.type === 'multi')

  return (
    <div className="page fade-in">
      {/* Header */}
      <div style={{ marginBottom: 28 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <p style={{ color: 'var(--text2)', fontSize: 13 }}>Hoş geldin</p>
            <h1 style={{ fontSize: 24, fontWeight: 800 }}>{session.nickname}</h1>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 4 }}>
            <span className="badge badge-table">📍 Masa {session.tableNumber}</span>
            <button
              onClick={() => navigate('/leaderboard')}
              style={{ background: 'none', border: 'none', color: 'var(--accent3)', fontSize: 12, cursor: 'pointer', fontFamily: 'Syne' }}
            >
              🏆 Skor Tablosu
            </button>
          </div>
        </div>
      </div>

      {/* Tek Kişilik */}
      <h2 style={{ fontSize: 12, fontWeight: 700, color: 'var(--text2)', letterSpacing: '2px', textTransform: 'uppercase', marginBottom: 12 }}>
        Tek Kişilik
      </h2>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 28 }}>
        {soloGames.map(game => (
          <GameCard key={game.slug} game={game} onClick={() => navigate(game.path)} />
        ))}
      </div>

      {/* Çok Oyunculu */}
      <h2 style={{ fontSize: 12, fontWeight: 700, color: 'var(--text2)', letterSpacing: '2px', textTransform: 'uppercase', marginBottom: 12 }}>
        Çok Oyunculu
      </h2>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        {multiGames.map(game => (
          <GameCard key={game.slug} game={game} onClick={() => navigate(game.path)} wide />
        ))}
      </div>

      <button className="btn btn-ghost" onClick={() => navigate('/menu')} style={{ marginTop: 32 }}>
        ← Menüye Dön
      </button>
    </div>
  )
}

function GameCard({ game, onClick, wide }) {
  return (
    <button onClick={onClick} style={{
      background: 'var(--bg2)',
      border: `1px solid var(--border)`,
      borderRadius: 'var(--radius)',
      padding: wide ? '16px 20px' : '20px 16px',
      cursor: 'pointer',
      textAlign: wide ? 'left' : 'center',
      transition: 'all 0.2s',
      display: wide ? 'flex' : 'block',
      alignItems: wide ? 'center' : undefined,
      gap: wide ? 16 : undefined,
      position: 'relative',
      overflow: 'hidden'
    }}
    onMouseEnter={e => e.currentTarget.style.borderColor = game.color}
    onMouseLeave={e => e.currentTarget.style.borderColor = 'var(--border)'}
    >
      {/* Renkli arka plan efekti */}
      <div style={{
        position: 'absolute', top: 0, right: 0,
        width: 60, height: 60,
        background: `radial-gradient(circle, ${game.color}30, transparent)`,
        borderRadius: '0 var(--radius) 0 60px'
      }} />

      <div style={{ fontSize: wide ? 32 : 40, marginBottom: wide ? 0 : 8 }}>{game.emoji}</div>
      <div>
        <div style={{ fontWeight: 700, fontSize: 15, color: 'var(--text)' }}>{game.name}</div>
        <div style={{ fontSize: 12, color: 'var(--text2)', marginTop: 2 }}>{game.desc}</div>
      </div>

      {game.type === 'multi' && (
        <span style={{
          marginLeft: 'auto',
          background: `${game.color}20`,
          color: game.color,
          border: `1px solid ${game.color}40`,
          borderRadius: 20,
          padding: '3px 10px',
          fontSize: 11,
          fontWeight: 700,
          whiteSpace: 'nowrap'
        }}>
          CANLI
        </span>
      )}
    </button>
  )
}
