import { useState, useEffect, useCallback, useRef } from 'react'
import { useParams, useLocation, useNavigate } from 'react-router-dom'
import { Chessboard } from 'react-chessboard'
import { Chess } from 'chess.js'
import { socket } from '../../lib/socket.js'
import { useStore } from '../../lib/store.js'
import Chat from '../../shared/chat/components/Chat.jsx'

export default function ChessPage() {
  const { lobbyId } = useParams()
  const { state: routeState } = useLocation()
  const navigate = useNavigate()
  const session = useStore(s => s.session)

  // chess.js instance — useRef ile sakla, sadece gerekli state'leri useState ile tut
  const gameRef = useRef(new Chess())
  const [fen, setFen] = useState('start')
  const [result, setResult] = useState(null) // null | 'win' | 'lose' | 'draw' | 'opponent_left'
  const [lastMove, setLastMove] = useState(null)      // { from, to }
  const [selectedSquare, setSelectedSquare] = useState(null)
  const [possibleMoves, setPossibleMoves] = useState({})
  const [capturedByMe, setCapturedByMe] = useState([])
  const [capturedByOpp, setCapturedByOpp] = useState([])
  const [moveHistory, setMoveHistory] = useState([])
  const [renderTick, setRenderTick] = useState(0) // Zorunlu render için

  const mySessionId = session?.sessionId
  const isHost = routeState?.host?.sessionId === mySessionId
  const myColor = isHost ? 'white' : 'black'
  const opponent = isHost ? routeState?.guest : routeState?.host

  const isMyTurn = useCallback(() => {
    return gameRef.current.turn() === (isHost ? 'w' : 'b')
  }, [isHost])

  // Socket event'lerini dinle
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

    socket.on('game_state_updated', (newState) => {
      // Rakibin hamlesi geldi
      if (newState.lastMove && newState.lastMove.sessionId !== mySessionId) {
        const { from, to, promotion } = newState.lastMove
        const move = gameRef.current.move({ from, to, promotion: promotion || 'q' })
        if (move) {
          updateGameState(move)
          if (gameRef.current.isCheckmate()) setResult('lose')
          else if (gameRef.current.isDraw()) setResult('draw')
        }
      }
    })

    socket.on('opponent_disconnected', () => setResult('opponent_left'))

    return () => {
      socket.off('game_state_updated')
      socket.off('opponent_disconnected')
    }
  }, [mySessionId])

  function updateGameState(move) {
    setFen(gameRef.current.fen())
    setLastMove({ from: move.from, to: move.to })
    setSelectedSquare(null)
    setPossibleMoves({})
    setMoveHistory(prev => [...prev, move.san])

    // Alınan taşları güncelle
    if (move.captured) {
      const piece = move.captured
      if (move.color === (isHost ? 'w' : 'b')) {
        setCapturedByMe(prev => [...prev, piece])
      } else {
        setCapturedByOpp(prev => [...prev, piece])
      }
    }
    // Render tick ile zorla güncelle
    setRenderTick(prev => prev + 1)
  }

  // Kare tıklandığında
  function onSquareClick(square) {
    if (!isMyTurn() || result) return

    // Zaten seçili kareye tıklandıysa seçimi kaldır
    if (selectedSquare === square) {
      setSelectedSquare(null)
      setPossibleMoves({})
      return
    }

    // Mümkün hamle varsa ve bu kare hedef ise hamle yap
    if (possibleMoves[square]) {
      handleMove(selectedSquare, square)
      return
    }

    // Kendi taşını seç
    const piece = gameRef.current.get(square)
    if (piece && piece.color === (isHost ? 'w' : 'b')) {
      setSelectedSquare(square)

      // Bu taşın mümkün hamlelerini vurgula
      const moves = gameRef.current.moves({ square, verbose: true })
      const highlights = {}
      moves.forEach(m => {
        highlights[m.to] = {
          background: gameRef.current.get(m.to)
            ? 'radial-gradient(circle, rgba(233,69,96,0.5) 70%, transparent 70%)'
            : 'radial-gradient(circle, rgba(0,212,255,0.4) 30%, transparent 30%)',
          borderRadius: '50%'
        }
      })
      setPossibleMoves(highlights)
    }
  }

  // Sürükle bırak
  function onPieceDrop(sourceSquare, targetSquare, piece) {
    if (!isMyTurn() || result) return false
    return handleMove(sourceSquare, targetSquare, piece)
  }

  function handleMove(from, to, piece) {
    // Piyon terfisi
    const promotion = piece?.[1]?.toLowerCase() === 'p' &&
      ((isHost && to[1] === '8') || (!isHost && to[1] === '1'))
      ? 'q' : undefined

    const move = gameRef.current.move({ from, to, promotion: promotion || 'q' })
    if (!move) return false

    updateGameState(move)

    const isCheckmate = gameRef.current.isCheckmate()
    const isDraw = gameRef.current.isDraw()

    // Backend'e gönder
    socket.emit('make_move', {
      lobbyId,
      sessionId: mySessionId,
      move: { from, to, promotion: move.promotion || null, isCheckmate, isDraw, san: move.san }
    })

    if (isCheckmate) setResult('win')
    else if (isDraw) setResult('draw')

    return true
  }

  // Kare stilleri
  const customSquareStyles = {}

  // Son hamle vurgusu
  if (lastMove) {
    customSquareStyles[lastMove.from] = { backgroundColor: 'rgba(245,166,35,0.25)' }
    customSquareStyles[lastMove.to] = { backgroundColor: 'rgba(245,166,35,0.4)' }
  }

  // Seçili kare
  if (selectedSquare) {
    customSquareStyles[selectedSquare] = { backgroundColor: 'rgba(0,212,255,0.35)' }
  }

  // Mümkün hamleler
  Object.assign(customSquareStyles, possibleMoves)

  // Şah tehdidi
  if (gameRef.current.inCheck()) {
    const turn = gameRef.current.turn()
    for (const row of gameRef.current.board()) {
      for (const cell of row) {
        if (cell && cell.type === 'k' && cell.color === turn) {
          customSquareStyles[cell.square] = { backgroundColor: 'rgba(233,69,96,0.6)' }
        }
      }
    }
  }

  const PIECE_SYMBOLS = { p: '♟', r: '♜', n: '♞', b: '♝', q: '♛', k: '♚' }

  return (
    <div className="page fade-in" style={{ alignItems: 'center', paddingBottom: 32 }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', width: '100%', marginBottom: 12 }}>
        <button onClick={() => navigate('/games')} style={{
          background: 'none', border: 'none', color: 'var(--text2)', cursor: 'pointer', fontSize: 20, padding: 4
        }}>←</button>
        <div style={{ textAlign: 'center' }}>
          <h2 style={{ fontWeight: 800, fontSize: 18 }}>♟️ Satranç</h2>
          {!result && (
            <p style={{ fontSize: 12, color: isMyTurn() ? 'var(--accent)' : 'var(--text2)', marginTop: 2 }}>
              {isMyTurn() ? '⚡ Senin sıran' : '⏳ Rakip düşünüyor...'}
            </p>
          )}
        </div>
        <div style={{ width: 28 }} />
      </div>

      {/* Rakip */}
      <PlayerBar
        nickname={opponent?.nickname || '?'}
        tableNumber={opponent?.tableNumber}
        color={isHost ? 'black' : 'white'}
        isActive={!isMyTurn() && !result}
        captured={capturedByOpp}
        pieceSymbols={PIECE_SYMBOLS}
      />

      {/* Satranç tahtası */}
      <div style={{ width: '100%', maxWidth: 420, position: 'relative' }}>
        <Chessboard
          position={fen}
          onSquareClick={onSquareClick}
          onPieceDrop={onPieceDrop}
          boardOrientation={myColor}
          customSquareStyles={customSquareStyles}
          customDarkSquareStyle={{ backgroundColor: '#2c2c4a' }}
          customLightSquareStyle={{ backgroundColor: '#e8e0d5' }}
          animationDuration={180}
          arePiecesDraggable={isMyTurn() && !result}
          customBoardStyle={{
            borderRadius: 8,
            boxShadow: '0 8px 32px rgba(0,0,0,0.4)'
          }}
        />
      </div>

      {/* Ben */}
      <PlayerBar
        nickname={`${session?.nickname} (Sen)`}
        tableNumber={session?.tableNumber}
        color={myColor}
        isActive={isMyTurn() && !result}
        captured={capturedByMe}
        pieceSymbols={PIECE_SYMBOLS}
      />

      {/* Hamle geçmişi */}
      {moveHistory.length > 0 && !result && (
        <div style={{
          width: '100%', background: 'var(--bg2)',
          border: '1px solid var(--border)', borderRadius: 'var(--radius)',
          padding: '10px 14px', marginTop: 4
        }}>
          <p style={{ fontSize: 11, color: 'var(--text2)', marginBottom: 6 }}>SON HAMLELERs</p>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4 }}>
            {moveHistory.slice(-10).map((m, i) => (
              <span key={i} style={{
                fontFamily: 'Space Mono', fontSize: 12, padding: '2px 8px',
                background: 'var(--bg3)', borderRadius: 4,
                color: i === moveHistory.length - 1 ? 'var(--accent2)' : 'var(--text2)'
              }}>{m}</span>
            ))}
          </div>
        </div>
      )}

      {/* Sonuç overlay */}
      {result && (
        <div className="card" style={{
          marginTop: 16, textAlign: 'center', width: '100%',
          background: result === 'win' ? 'rgba(39,174,96,0.1)' :
                      result === 'lose' ? 'rgba(233,69,96,0.08)' : 'var(--bg2)',
          border: `1px solid ${result === 'win' ? '#27ae60' : result === 'lose' ? 'var(--accent)' : 'var(--border)'}`
        }}>
          <p style={{ fontSize: 44, marginBottom: 8 }}>
            {result === 'win' ? '🏆' : result === 'lose' ? '😔' : result === 'draw' ? '🤝' : '👋'}
          </p>
          <p style={{ fontWeight: 800, fontSize: 22 }}>
            {result === 'win' ? 'Kazandın!' :
             result === 'lose' ? 'Kaybettin' :
             result === 'draw' ? 'Berabere!' : 'Rakip ayrıldı'}
          </p>
          {result === 'win' && (
            <p style={{ color: 'var(--text2)', fontSize: 13, marginTop: 4 }}>
              {moveHistory.length} hamlede kazandın
            </p>
          )}
          <div style={{ display: 'flex', gap: 8, marginTop: 16 }}>
            <button className="btn btn-primary" onClick={() => navigate('/lobby/chess')}>
              Tekrar Oyna
            </button>
            <button className="btn btn-ghost" onClick={() => navigate('/games')}>
              Oyunlar
            </button>
          </div>
        </div>
      )}

      {/* Teslim ol */}
      {!result && (
        <button
          className="btn btn-ghost"
          onClick={() => socket.emit('resign', { lobbyId, sessionId: mySessionId })}
          style={{ marginTop: 8, color: 'var(--accent)', fontSize: 13 }}
        >
          🏳️ Teslim Ol
        </button>
      )}

      {/* Chat */}
      {lobbyId && <Chat roomId={lobbyId} position="bottom-right" />}
    </div>
  )
}

// ─── Player Bar Bileşeni ──────────────────────────────────────────────────────

function PlayerBar({ nickname, tableNumber, color, isActive, captured, pieceSymbols }) {
  return (
    <div style={{
      width: '100%',
      display: 'flex',
      alignItems: 'center',
      gap: 10,
      padding: '10px 14px',
      background: isActive ? 'rgba(233,69,96,0.08)' : 'var(--bg2)',
      border: `1px solid ${isActive ? 'var(--accent)' : 'var(--border)'}`,
      borderRadius: 'var(--radius)',
      transition: 'all 0.2s',
      margin: '4px 0'
    }}>
      {/* Renk göstergesi */}
      <div style={{
        width: 28, height: 28,
        borderRadius: '50%',
        background: color === 'white' ? '#f0f0f0' : '#1a1a1a',
        border: '2px solid var(--border)',
        flexShrink: 0
      }} />

      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontWeight: 700, fontSize: 14, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
          {nickname}
        </div>
        <div style={{ fontSize: 11, color: 'var(--text2)' }}>📍 Masa {tableNumber}</div>
      </div>

      {/* Alınan taşlar */}
      {captured.length > 0 && (
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 2, maxWidth: 100, justifyContent: 'flex-end' }}>
          {captured.slice(-8).map((p, i) => (
            <span key={i} style={{ fontSize: 14, opacity: 0.8 }}>
              {pieceSymbols[p] || p}
            </span>
          ))}
        </div>
      )}

      {isActive && (
        <div style={{
          width: 8, height: 8, borderRadius: '50%',
          background: 'var(--accent)',
          animation: 'pulse 1s infinite',
          flexShrink: 0
        }} />
      )}
    </div>
  )
}
