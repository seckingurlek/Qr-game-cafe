import { ClientChatEvents, ServerChatEvents } from '../chat/constants/chatEvents.js'

export function handleChatEvents(socket, io, db, redis) {

  // Odaya katıl
  socket.on(ClientChatEvents.JOIN_ROOM, async ({ roomId, userId }) => {
    try {
      // Chat room'a katıl (lobby ile aynı room ID kullanıyoruz)
      socket.join(`chat:${roomId}`)

      // Diğer oyuncuya bildir (varsa)
      socket.to(`chat:${roomId}`).emit(ServerChatEvents.USER_JOINED, {
        roomId,
        userId,
        nickname: socket.data.nickname || 'Bir oyuncu'
      })

      socket.emit(ServerChatEvents.ROOM_JOINED, { roomId })

      console.log(`💬 Chat: ${userId} joined room ${roomId}`)
    } catch (err) {
      console.error('Chat join error:', err)
    }
  })

  // Odadan ayrıl
  socket.on(ClientChatEvents.LEAVE_ROOM, async ({ roomId }) => {
    try {
      socket.leave(`chat:${roomId}`)

      socket.to(`chat:${roomId}`).emit(ServerChatEvents.USER_LEFT, {
        roomId,
        userId: socket.data.sessionId
      })

      console.log(`💬 Chat: User left room ${roomId}`)
    } catch (err) {
      console.error('Chat leave error:', err)
    }
  })

  // Mesaj gönder
  socket.on(ClientChatEvents.SEND_MESSAGE, async ({ roomId, message, userId }) => {
    try {
      // Validasyon
      if (!message || !message.trim()) return
      if (message.length > 200) return

      // Mesaj objesi
      const messageData = {
        id: `msg_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        roomId,
        senderId: userId,
        senderName: socket.data.nickname || 'Bir oyuncu',
        message: message.trim(),
        type: 'text',
        createdAt: new Date().toISOString()
      }

      // Room'daki herkese gönder (kendisi dahil)
      io.to(`chat:${roomId}`).emit(ServerChatEvents.MESSAGE_RECEIVED, messageData)

      console.log(`💬 Chat: Message in ${roomId} from ${userId}`)
    } catch (err) {
      console.error('Chat message error:', err)
    }
  })

  // Typing başladı
  socket.on(ClientChatEvents.START_TYPING, ({ roomId, userId }) => {
    try {
      socket.to(`chat:${roomId}`).emit(ServerChatEvents.USER_TYPING, {
        roomId,
        userId
      })
    } catch (err) {
      console.error('Chat typing error:', err)
    }
  })

  // Typing bitti
  socket.on(ClientChatEvents.STOP_TYPING, ({ roomId, userId }) => {
    try {
      socket.to(`chat:${roomId}`).emit(ServerChatEvents.USER_STOPPED_TYPING, {
        roomId,
        userId
      })
    } catch (err) {
      console.error('Chat stop typing error:', err)
    }
  })
}
