import { socket } from '../../../lib/socket.js'
import { ClientChatEvents, ServerChatEvents } from '../constants/chatEvents.js'

class ChatSocketManager {
  constructor() {
    this.rooms = new Map() // roomId -> Set of callbacks
    this.typingTimers = new Map() // roomId -> timer
    this.init()
  }

  init() {
    // Mesaj alındı
    socket.on(ServerChatEvents.MESSAGE_RECEIVED, (data) => {
      this.emitToRoom(data.roomId, 'message', data)
    })

    // Typing başladı
    socket.on(ServerChatEvents.USER_TYPING, (data) => {
      this.emitToRoom(data.roomId, 'typing', data)
    })

    // Typing bitti
    socket.on(ServerChatEvents.USER_STOPPED_TYPING, (data) => {
      this.emitToRoom(data.roomId, 'stoppedTyping', data)
    })

    // Kullanıcı katıldı
    socket.on(ServerChatEvents.USER_JOINED, (data) => {
      this.emitToRoom(data.roomId, 'userJoined', data)
    })

    // Kullanıcı ayrıldı
    socket.on(ServerChatEvents.USER_LEFT, (data) => {
      this.emitToRoom(data.roomId, 'userLeft', data)
    })

    // Odaya katıldı
    socket.on(ServerChatEvents.ROOM_JOINED, (data) => {
      console.log('✅ Chat room joined:', data.roomId)
    })
  }

  emitToRoom(roomId, event, data) {
    const callbacks = this.rooms.get(roomId)
    if (callbacks) {
      callbacks.forEach(cb => cb(event, data))
    }
  }

  joinRoom(roomId, userId) {
    if (!socket.connected) {
      socket.connect()
      socket.once('connect', () => {
        socket.emit(ClientChatEvents.JOIN_ROOM, { roomId, userId })
      })
    } else {
      socket.emit(ClientChatEvents.JOIN_ROOM, { roomId, userId })
    }
  }

  leaveRoom(roomId) {
    socket.emit(ClientChatEvents.LEAVE_ROOM, { roomId })
  }

  sendMessage(roomId, message, userId) {
    socket.emit(ClientChatEvents.SEND_MESSAGE, {
      roomId,
      message,
      userId
    })
  }

  startTyping(roomId, userId) {
    socket.emit(ClientChatEvents.START_TYPING, { roomId, userId })

    // 3 saniye sonra otomatik durdur
    const key = `${roomId}:${userId}`
    if (this.typingTimers.has(key)) {
      clearTimeout(this.typingTimers.get(key))
    }

    const timer = setTimeout(() => {
      this.stopTyping(roomId, userId)
    }, 3000)

    this.typingTimers.set(key, timer)
  }

  stopTyping(roomId, userId) {
    socket.emit(ClientChatEvents.STOP_TYPING, { roomId, userId })

    const key = `${roomId}:${userId}`
    if (this.typingTimers.has(key)) {
      clearTimeout(this.typingTimers.get(key))
      this.typingTimers.delete(key)
    }
  }

  // Room'a callback kaydet
  onRoomEvent(roomId, callback) {
    if (!this.rooms.has(roomId)) {
      this.rooms.set(roomId, new Set())
    }
    this.rooms.get(roomId).add(callback)

    // Cleanup fonksiyonu döndür
    return () => {
      const callbacks = this.rooms.get(roomId)
      if (callbacks) {
        callbacks.delete(callback)
        if (callbacks.size === 0) {
          this.rooms.delete(roomId)
        }
      }
    }
  }
}

// Singleton
export const chatSocketManager = new ChatSocketManager()
