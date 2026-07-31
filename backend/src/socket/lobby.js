import { RedisKeys } from '../db/redis.js'

export function handleLobbyEvents(socket, io, db, redis) {

  // Lobi listesini dinle (realtime güncelleme için)
  socket.on('watch_lobbies', async ({ gameSlug }) => {
    socket.join(`lobbies:${gameSlug}`)
    // Mevcut lobi listesini hemen gönder
    await broadcastLobbyList(io, db, gameSlug)
  })

  // Lobi oluştur ve bekle
  socket.on('create_lobby', async ({ gameSlug, sessionId }) => {
    try {
      console.log('🎮 create_lobby received:', { gameSlug, sessionId })

      // DB'de lobi oluştur
      const existing = await db.query(
        `SELECT id FROM game_lobbies WHERE host_session_id = $1 AND status = 'waiting'`,
        [sessionId]
      )

      let lobbyId
      if (existing.rows[0]) {
        lobbyId = existing.rows[0].id
      } else {
        const result = await db.query(
          `INSERT INTO game_lobbies (game_slug, host_session_id) VALUES ($1, $2) RETURNING id`,
          [gameSlug, sessionId]
        )
        lobbyId = result.rows[0].id
      }

      // Socket odaya gir
      socket.join(`lobby:${lobbyId}`)
      socket.data.lobbyId = lobbyId
      socket.data.role = 'host'

      // Redis'e lobi state kaydet
      await redis.set(RedisKeys.lobby(lobbyId), JSON.stringify({
        gameSlug,
        hostSessionId: sessionId,
        status: 'waiting'
      }), { EX: 1800 })

      socket.emit('lobby_created', { lobbyId })

      // Lobi listesini güncelle
      await broadcastLobbyList(io, db, gameSlug)

    } catch (err) {
      socket.emit('error', { message: 'Lobi oluşturulamadı' })
    }
  })

  // Lobiye katıl
  socket.on('join_lobby', async ({ lobbyId, sessionId }) => {
    try {
      const lobby = await db.query(
        `SELECT gl.*, s.nickname as host_nickname, t.table_number as host_table
         FROM game_lobbies gl
         JOIN sessions s ON gl.host_session_id = s.id
         JOIN tables t ON s.table_id = t.id
         WHERE gl.id = $1 AND gl.status = 'waiting'`,
        [lobbyId]
      )

      if (!lobby.rows[0]) {
        return socket.emit('error', { message: 'Lobi bulunamadı veya dolu' })
      }
      if (lobby.rows[0].host_session_id === sessionId) {
        return socket.emit('error', { message: 'Kendi lobine katılamazsın' })
      }

      // DB güncelle
      await db.query(
        `UPDATE game_lobbies 
         SET guest_session_id = $1, status = 'playing', started_at = NOW()
         WHERE id = $2`,
        [sessionId, lobbyId]
      )

      // Guest socket odaya gir
      socket.join(`lobby:${lobbyId}`)
      socket.data.lobbyId = lobbyId
      socket.data.role = 'guest'

      // Rakip odasına ekle (disconnect bildirimi için)
      const hostSessionId = lobby.rows[0].host_session_id
      socket.join(`lobby:opponent:${hostSessionId}`)
      io.to(`session:${hostSessionId}`).socketsJoin(`lobby:opponent:${sessionId}`)

      // Guest bilgisi getir
      const guestInfo = await db.query(
        `SELECT s.nickname, t.table_number
         FROM sessions s JOIN tables t ON s.table_id = t.id
         WHERE s.id = $1`,
        [sessionId]
      )

      // İki tarafa da bildir
      io.to(`lobby:${lobbyId}`).emit('game_start', {
        lobbyId,
        gameSlug: lobby.rows[0].game_slug,
        host: {
          sessionId: hostSessionId,
          nickname: lobby.rows[0].host_nickname,
          tableNumber: lobby.rows[0].host_table
        },
        guest: {
          sessionId,
          nickname: guestInfo.rows[0].nickname,
          tableNumber: guestInfo.rows[0].table_number
        }
      })

      // Lobi listesini güncelle
      await broadcastLobbyList(io, db, lobby.rows[0].game_slug)

    } catch (err) {
      socket.emit('error', { message: 'Lobiye katılınamadı' })
    }
  })

  // Lobiyi iptal et
  socket.on('cancel_lobby', async ({ lobbyId, sessionId }) => {
    await db.query(
      `UPDATE game_lobbies SET status = 'finished' WHERE id = $1 AND host_session_id = $2`,
      [lobbyId, sessionId]
    )
    await redis.del(RedisKeys.lobby(lobbyId))
    socket.leave(`lobby:${lobbyId}`)

    const lobby = await db.query('SELECT game_slug FROM game_lobbies WHERE id = $1', [lobbyId])
    if (lobby.rows[0]) {
      await broadcastLobbyList(io, db, lobby.rows[0].game_slug)
    }
  })
}

// Lobi listesini dinleyenlere gönder
async function broadcastLobbyList(io, db, gameSlug) {
  const result = await db.query(
    `SELECT gl.id, gl.created_at,
            s.nickname as host_nickname, t.table_number as host_table_number
     FROM game_lobbies gl
     JOIN sessions s ON gl.host_session_id = s.id
     JOIN tables t ON s.table_id = t.id
     WHERE gl.game_slug = $1 AND gl.status = 'waiting'
     ORDER BY gl.created_at ASC`,
    [gameSlug]
  )
  io.to(`lobbies:${gameSlug}`).emit('lobby_list_updated', result.rows)
}
