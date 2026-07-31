import { handleLobbyEvents } from './lobby.js'
import { handleGameEvents } from './game.js'
import { handleChatEvents } from './chat.js'
import { RedisKeys } from '../db/redis.js'

export function registerSocketHandlers(io, db, redis) {
  io.on('connection', async (socket) => {
    console.log(`Socket connected: ${socket.id}`)

    // Kullanıcı bağlandığında session kaydı
    socket.on('register', async ({ sessionId }) => {
      if (!sessionId) return

      // Socket → session eşleştir (Redis)
      await redis.set(RedisKeys.playerSocket(sessionId), socket.id, { EX: 3600 })

      // Online oyunculara ekle
      await redis.sAdd(RedisKeys.onlinePlayers(), sessionId)

      socket.data.sessionId = sessionId
      socket.join(`session:${sessionId}`)

      console.log(`Session ${sessionId} registered to socket ${socket.id}`)
    })

    // Lobi event'leri
    handleLobbyEvents(socket, io, db, redis)

    // Oyun event'leri
    handleGameEvents(socket, io, db, redis)

    // Chat event'leri
    handleChatEvents(socket, io, db, redis)

    // Bağlantı kopunca
    socket.on('disconnect', async () => {
      const { sessionId } = socket.data
      if (sessionId) {
        await redis.sRem(RedisKeys.onlinePlayers(), sessionId)
        await redis.del(RedisKeys.playerSocket(sessionId))
        
        // Aktif lobilerini iptal et
        await db.query(
          `UPDATE game_lobbies SET status = 'finished'
           WHERE (host_session_id = $1 OR guest_session_id = $1)
           AND status IN ('waiting', 'playing')`,
          [sessionId]
        )

        // Rakibine bildir
        io.to(`lobby:opponent:${sessionId}`).emit('opponent_disconnected')
      }
      console.log(`Socket disconnected: ${socket.id}`)
    })
  })
}
