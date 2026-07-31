import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { socket } from '../lib/socket.js'
import { useStore } from '../lib/store.js'

const GAME_INFO = {
  tictactoe: { name: 'Tic-Tac-Toe', emoji: '⭕', color: '#e94560' },
  chess:     { name: 'Satranç',     emoji: '♟️', color: '#f5a623' }
}

export default function GameLobby() {
  const { gameSlug } = useParams()
  const navigate = useNavigate()
  const session = useStore(s => s.session)
  const [lobbies, setLobbies] = useState([])
  const [myLobbyId, setMyLobbyId] = useState(null)
  const [status, setStatus] = useState('browsing') // browsing | waiting | matched
  const [isCreating, setIsCreating] = useState(false)
  const game = GAME_INFO[gameSlug]

  if (!session) { navigate('/nickname'); return null }

  useEffect(() => {
    // Socket bağlı değilse bağlan
    if (!socket.connected) {
      socket.connect()
    }

    // Lobi listesini dinle
    socket.emit('watch_lobbies', { gameSlug })
    socket.on('lobby_list_updated', setLobbies)

    // Eşleşme gerçekleşti
    socket.on('game_start', ({ lobbyId, hostSessionId, guestSessionId, host, guest }) => {
      setStatus('matched')
      setTimeout(() => {
        socket.emit('init_game', {
          lobbyId,
          gameSlug,
          hostSessionId: host.sessionId,
          guestSessionId: guest.sessionId
        })
        navigate(`/play/${gameSlug}/${lobbyId}`, {
          state: { host, guest, lobbyId }
        })
      }, 1500)
    })

    socket.on('error', ({ message }) => alert(message))

    return () => {
      socket.off('lobby_list_updated')
      socket.off('game_start')
      socket.off('error')
    }
  }, [gameSlug])

  function createLobby() {
    if (!socket.connected) {
      alert('Bağlantı yok. Lütfen bekleyin...')
      return
    }

    if (isCreating) {
      return // Zaten oluşturuluyor, çift tıklamayı engelle
    }

    setIsCreating(true)
    console.log('Creating lobby...', { gameSlug, sessionId: session.sessionId })

    socket.emit('create_lobby', { gameSlug, sessionId: session.sessionId })

    socket.once('lobby_created', ({ lobbyId }) => {
      console.log('Lobby created:', lobbyId)
      setIsCreating(false)
      setMyLobbyId(lobbyId)
      setStatus('waiting')
    })

    socket.once('error', () => {
      setIsCreating(false)
    })

    // Timeout - 5 saniye içinde cevap gelmezse
    setTimeout(() => {
      if (status === 'browsing') {
        setIsCreating(false)
        alert('Lobi oluşturulamadı. Tekrar deneyin.')
      }
    }, 5000)
  }

  function joinLobby(lobbyId) {
    socket.emit('join_lobby', { lobbyId, sessionId: session.sessionId })
  }

  function cancelLobby() {
    socket.emit('cancel_lobby', { lobbyId: myLobbyId, sessionId: session.sessionId })
    setMyLobbyId(null)
    setStatus('browsing')
  }

  if (status === 'matched') return (
    <div className="page" style={{ justifyContent: 'center', alignItems: 'center', gap: 16 }}>
      <div style={{ fontSize: 64 }}>🎉</div>
      <h2 style={{ fontWeight: 800, fontSize: 24 }}>Eşleşme Bulundu!</h2>
      <p style={{ color: 'var(--text2)' }}>Oyun başlıyor...</p>
    </div>
  )

  return (
    <div className="page fade-in">
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 28 }}>
        <button onClick={() => navigate('/games')} style={{
          background: 'none', border: 'none', color: 'var(--text2)', cursor: 'pointer', fontSize: 20
        }}>←</button>
        <div>
          <h1 style={{ fontSize: 22, fontWeight: 800 }}>{game?.emoji} {game?.name}</h1>
          <p style={{ color: 'var(--text2)', fontSize: 13 }}>Çevrimiçi Lobi</p>
        </div>
      </div>

      {/* Nick bilgisi */}
      <div style={{ display: 'flex', gap: 8, marginBottom: 24 }}>
        <span className="badge badge-table">📍 Masa {session.tableNumber}</span>
        <span className="badge badge-online">👤 {session.nickname}</span>
      </div>

      {/* Kendi lobim - bekliyorum */}
      {status === 'waiting' && (
        <div className="card" style={{
          textAlign: 'center',
          border: `1px solid ${game?.color}50`,
          background: `${game?.color}10`,
          marginBottom: 24
        }}>
          <div style={{ fontSize: 32, marginBottom: 8, animation: 'pulse 1.5s infinite' }}>⏳</div>
          <p style={{ fontWeight: 700 }}>Rakip bekliyorsun...</p>
          <p style={{ color: 'var(--text2)', fontSize: 13, marginTop: 4 }}>
            Diğer masalardan biri seni görecek
          </p>
          <button className="btn btn-ghost" onClick={cancelLobby} style={{ marginTop: 16 }}>
            İptal Et
          </button>
        </div>
      )}

      {/* Bekleyen lobiler */}
      <h2 style={{ fontSize: 12, fontWeight: 700, color: 'var(--text2)', letterSpacing: '2px', textTransform: 'uppercase', marginBottom: 12 }}>
        Bekleyen Oyuncular ({lobbies.length})
      </h2>

      {lobbies.length === 0 ? (
        <div className="card" style={{ textAlign: 'center', padding: 32 }}>
          <p style={{ color: 'var(--text2)', fontSize: 14 }}>
            Henüz kimse beklemiyor.<br />İlk sen lobi aç!
          </p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {lobbies.map(lobby => (
            <div key={lobby.id} className="card" style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              padding: '14px 16px'
            }}>
              <div>
                <div style={{ fontWeight: 700 }}>{lobby.host_nickname}</div>
                <div style={{ fontSize: 12, color: 'var(--text2)' }}>
                  📍 Masa {lobby.host_table_number}
                </div>
              </div>
              {lobby.host_session_id !== session.sessionId && (
                <button
                  onClick={() => joinLobby(lobby.id)}
                  style={{
                    background: game?.color,
                    color: 'white',
                    border: 'none',
                    borderRadius: 'var(--radius-sm)',
                    padding: '8px 16px',
                    fontFamily: 'Syne',
                    fontWeight: 700,
                    cursor: 'pointer',
                    fontSize: 14
                  }}
                >
                  Katıl
                </button>
              )}
              {lobby.host_session_id === session.sessionId && (
                <span style={{ color: 'var(--text2)', fontSize: 12 }}>Sen</span>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Lobi oluştur */}
      {status === 'browsing' && (
        <button
          className="btn btn-primary"
          onClick={createLobby}
          disabled={isCreating}
          style={{
            marginTop: 24,
            opacity: isCreating ? 0.6 : 1,
            cursor: isCreating ? 'not-allowed' : 'pointer'
          }}
        >
          {isCreating ? '⏳ Oluşturuluyor...' : '+ Yeni Oyun Aç'}
        </button>
      )}
    </div>
  )
}
