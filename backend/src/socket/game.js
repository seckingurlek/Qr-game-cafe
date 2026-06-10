import { RedisKeys } from '../db/redis.js'

export function handleGameEvents(socket, io, db, redis) {

  // Hamle gönder (TicTacToe / Satranç ortak)
  socket.on('make_move', async ({ lobbyId, sessionId, move }) => {
    try {
      const stateRaw = await redis.get(RedisKeys.game(lobbyId))
      const state = stateRaw ? JSON.parse(stateRaw) : null

      if (!state) {
        return socket.emit('error', { message: 'Oyun state bulunamadı' })
      }

      // Sıra kontrolü
      if (state.currentTurn !== sessionId) {
        return socket.emit('error', { message: 'Sıra sende değil' })
      }

      // Hamleyi uygula (oyuna göre)
      let newState
      if (state.gameSlug === 'tictactoe') {
        newState = applyTicTacToeMove(state, move, sessionId)
      } else if (state.gameSlug === 'chess') {
        newState = applyChessMove(state, move, sessionId)
      }

      if (!newState) {
        return socket.emit('error', { message: 'Geçersiz hamle' })
      }

      // Redis'e kaydet
      await redis.set(RedisKeys.game(lobbyId), JSON.stringify(newState), { EX: 3600 })

      // İki tarafa da gönder
      io.to(`lobby:${lobbyId}`).emit('game_state_updated', newState)

      // Oyun bitti mi?
      if (newState.status === 'finished') {
        await handleGameEnd(lobbyId, newState, db, redis, io)
      }

    } catch (err) {
      socket.emit('error', { message: 'Hamle gönderilemedi' })
    }
  })

  // Oyun state'ini başlat (join sonrası)
  socket.on('init_game', async ({ lobbyId, gameSlug, hostSessionId, guestSessionId }) => {
    const initialState = createInitialState(gameSlug, hostSessionId, guestSessionId, lobbyId)
    await redis.set(RedisKeys.game(lobbyId), JSON.stringify(initialState), { EX: 3600 })
    io.to(`lobby:${lobbyId}`).emit('game_state_updated', initialState)
  })

  // Oyunu terk et
  socket.on('resign', async ({ lobbyId, sessionId }) => {
    const stateRaw = await redis.get(RedisKeys.game(lobbyId))
    if (!stateRaw) return

    const state = JSON.parse(stateRaw)
    const winnerId = state.hostSessionId === sessionId
      ? state.guestSessionId
      : state.hostSessionId

    const finalState = { ...state, status: 'finished', winner: winnerId, reason: 'resign' }
    await redis.set(RedisKeys.game(lobbyId), JSON.stringify(finalState), { EX: 300 })
    io.to(`lobby:${lobbyId}`).emit('game_state_updated', finalState)
    await handleGameEnd(lobbyId, finalState, db, redis, io)
  })
}

// ─── TicTacToe Logic ─────────────────────────────────────────────────────────

function applyTicTacToeMove(state, move, sessionId) {
  const { index } = move
  if (state.board[index] !== null) return null

  const newBoard = [...state.board]
  const symbol = state.hostSessionId === sessionId ? 'X' : 'O'
  newBoard[index] = symbol

  const winner = checkTicTacToeWinner(newBoard)
  const isDraw = !winner && newBoard.every(cell => cell !== null)

  return {
    ...state,
    board: newBoard,
    currentTurn: state.currentTurn === state.hostSessionId
      ? state.guestSessionId
      : state.hostSessionId,
    status: winner || isDraw ? 'finished' : 'playing',
    winner: winner ? sessionId : null,
    isDraw,
    lastMove: { index, symbol }
  }
}

function checkTicTacToeWinner(board) {
  const lines = [
    [0,1,2],[3,4,5],[6,7,8], // yatay
    [0,3,6],[1,4,7],[2,5,8], // dikey
    [0,4,8],[2,4,6]           // çapraz
  ]
  for (const [a,b,c] of lines) {
    if (board[a] && board[a] === board[b] && board[a] === board[c]) {
      return board[a]
    }
  }
  return null
}

// ─── Chess Logic (basit - sadece hamle saklama, validasyon frontend'de) ──────

function applyChessMove(state, move, sessionId) {
  // Chess validasyonu frontend'de chess.js ile yapılır
  // Backend sadece hamleri saklar ve sıraya göre kontrol eder
  return {
    ...state,
    moves: [...(state.moves || []), { ...move, sessionId }],
    currentTurn: state.currentTurn === state.hostSessionId
      ? state.guestSessionId
      : state.hostSessionId,
    status: move.isCheckmate ? 'finished' : 'playing',
    winner: move.isCheckmate ? sessionId : null,
    lastMove: move
  }
}

// ─── Initial States ───────────────────────────────────────────────────────────

function createInitialState(gameSlug, hostSessionId, guestSessionId, lobbyId) {
  const base = {
    lobbyId,
    gameSlug,
    hostSessionId,
    guestSessionId,
    currentTurn: hostSessionId, // host (X) başlar
    status: 'playing',
    winner: null,
    startedAt: new Date().toISOString()
  }

  if (gameSlug === 'tictactoe') {
    return { ...base, board: Array(9).fill(null) }
  }
  if (gameSlug === 'chess') {
    return { ...base, moves: [], fen: 'start' }
  }

  return base
}

// ─── Game End ─────────────────────────────────────────────────────────────────

async function handleGameEnd(lobbyId, state, db, redis, io) {
  // DB güncelle
  await db.query(
    `UPDATE game_lobbies 
     SET status = 'finished', winner_session_id = $1, finished_at = NOW()
     WHERE id = $2`,
    [state.winner || null, lobbyId]
  )

  // Skor kaydet (multiplayer skor kaydı için)
  if (state.winner) {
    await db.query(
      `INSERT INTO scores (session_id, game_slug, score)
       VALUES ($1, $2, 1)`,
      [state.winner, state.gameSlug]
    )
  }

  // Lobi Redis'ten temizle (5dk sonra)
  await redis.expire(RedisKeys.game(lobbyId), 300)
}
