import { useState, useEffect } from 'react'
import { useParams, useLocation, useNavigate } from 'react-router-dom'
import { socket } from '../../lib/socket.js'
import { useStore } from '../../lib/store.js'
import Chat from '../../shared/chat/components/Chat.jsx'
import { useGameScrollLock } from '../../lib/hooks/useGameScrollLock.js'

export default function TicTacToePage() {
  const { lobbyId } = useParams()
  const { state: routeState } = useLocation()
  const navigate = useNavigate()
  const session = useStore(s => s.session)
  const [gameState, setGameState] = useState(null)
  const [result, setResult] = useState(null)

  // Scroll kilidi - oyun içinde her zaman aktif
  useGameScrollLock(true)

  const mySessionId = session?.sessionId
  const isHost = routeState?.host?.sessionId === mySessionId
  const mySymbol = isHost ? 'X' : 'O'
  const opponent = isHost ? routeState?.guest : routeState?.host

  useEffect(() => {
    // Socket bağlı değilse bağlan
    if (!socket.connected) {
      socket.connect()
      socket.once('connect', () => {
        if (mySessionId) {
          socket.emit('register', { sessionId: mySessionId })
        }
      })
    } else if (mySessionId) {
      // Bağlı ama register edilmemişse
      socket.emit('register', { sessionId: mySessionId })
    }

    // Oyun state'ini yükle (lobbyId varsa)
    if (lobbyId && routeState?.host && routeState?.guest) {
      // Backend'den oyun state'ini iste
      socket.emit('get_game_state', { lobbyId })
    }

    socket.on('game_state_updated', (state) => {
      setGameState(state)
      if (state.status === 'finished') {
        setResult(
          state.isDraw ? 'draw' :
          state.winner === mySessionId ? 'win' : 'lose'
        )
      }
    })
    socket.on('opponent_disconnected', () => setResult('opponent_left'))

    return () => {
      socket.off('game_state_updated')
      socket.off('opponent_disconnected')
      socket.off('get_game_state') // init_game için de kullanabiliriz
    }
  }, [mySessionId, lobbyId, routeState])

  function makeMove(index) {
    if (!gameState || gameState.board[index] || gameState.currentTurn !== mySessionId || result) return
    socket.emit('make_move', { lobbyId, sessionId: mySessionId, move: { index } })
  }

  const isMyTurn = gameState?.currentTurn === mySessionId

  return (
    <div className="page fade-in" style={{ alignItems: 'center' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', width: '100%', marginBottom: 20 }}>
        <button onClick={() => navigate('/games')} style={{
          background: 'none', border: 'none', color: 'var(--text2)', cursor: 'pointer', fontSize: 20
        }}>←</button>
        <h2 style={{ fontWeight: 800 }}>⭕ Tic-Tac-Toe</h2>
        <div />
      </div>

      {/* Oyuncu bilgisi */}
      <div style={{ display: 'flex', gap: 12, justifyContent: 'center', marginBottom: 20, width: '100%' }}>
        <PlayerCard
          name={`${session?.nickname} (${mySymbol})`}
          table={session?.tableNumber}
          active={isMyTurn && !result}
          color="var(--accent)"
        />
        <div style={{ display: 'flex', alignItems: 'center', color: 'var(--text2)', fontWeight: 700 }}>VS</div>
        <PlayerCard
          name={`${opponent?.nickname || '?'} (${isHost ? 'O' : 'X'})`}
          table={opponent?.tableNumber}
          active={!isMyTurn && !result}
          color="var(--accent3)"
        />
      </div>

      {/* Sıra göstergesi */}
      {!result && gameState && (
        <p style={{ color: 'var(--text2)', marginBottom: 16, fontSize: 14 }}>
          {isMyTurn ? '⚡ Senin sıran!' : '⏳ Rakip düşünüyor...'}
        </p>
      )}

      {/* Tahta */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(3, 1fr)',
        gap: 8,
        width: 280
      }}>
        {Array(9).fill(null).map((_, i) => {
          const cell = gameState?.board?.[i]
          const isLast = gameState?.lastMove?.index === i
          return (
            <button key={i} onClick={() => makeMove(i)} style={{
              width: 86, height: 86,
              background: isLast ? 'rgba(233,69,96,0.15)' : 'var(--bg2)',
              border: `2px solid ${isLast ? 'var(--accent)' : 'var(--border)'}`,
              borderRadius: 12,
              fontSize: 36,
              cursor: cell || result || !isMyTurn ? 'default' : 'pointer',
              transition: 'all 0.15s',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              color: cell === 'X' ? 'var(--accent)' : 'var(--accent3)'
            }}>
              {cell}
            </button>
          )
        })}
      </div>

      {/* Sonuç */}
      {result && (
        <div className="card" style={{
          marginTop: 24,
          textAlign: 'center',
          width: '100%',
          background: result === 'win' ? 'rgba(39,174,96,0.1)' :
                      result === 'lose' ? 'rgba(233,69,96,0.1)' : 'var(--bg2)'
        }}>
          <p style={{ fontSize: 40, marginBottom: 8 }}>
            {result === 'win' ? '🏆' : result === 'lose' ? '😔' : result === 'draw' ? '🤝' : '👋'}
          </p>
          <p style={{ fontWeight: 800, fontSize: 20 }}>
            {result === 'win' ? 'Kazandın!' :
             result === 'lose' ? 'Kaybettin' :
             result === 'draw' ? 'Berabere!' : 'Rakip ayrıldı'}
          </p>
          <div style={{ display: 'flex', gap: 8, marginTop: 16 }}>
            <button className="btn btn-secondary" onClick={() => navigate('/lobby/tictactoe')}>
              Tekrar Oyna
            </button>
            <button className="btn btn-ghost" onClick={() => navigate('/games')}>
              Oyunlar
            </button>
          </div>
        </div>
      )}

      {/* Teslim ol */}
      {!result && gameState && (
        <button className="btn btn-ghost" onClick={() => socket.emit('resign', { lobbyId, sessionId: mySessionId })}
          style={{ marginTop: 16, color: 'var(--accent)' }}>
          Teslim Ol
        </button>
      )}

      {/* Chat */}
      {lobbyId && <Chat roomId={lobbyId} position="bottom-right" />}
    </div>
  )
}

function PlayerCard({ name, table, active, color }) {
  return (
    <div style={{
      flex: 1,
      background: active ? `${color}15` : 'var(--bg2)',
      border: `1px solid ${active ? color : 'var(--border)'}`,
      borderRadius: 12,
      padding: '10px 8px',
      textAlign: 'center',
      transition: 'all 0.2s'
    }}>
      <div style={{ fontWeight: 700, fontSize: 13 }}>{name}</div>
      <div style={{ fontSize: 11, color: 'var(--text2)' }}>Masa {table}</div>
    </div>
  )
}
