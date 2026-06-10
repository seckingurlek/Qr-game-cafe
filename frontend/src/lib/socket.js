import { io } from 'socket.io-client'

const SOCKET_URL = import.meta.env.VITE_SOCKET_URL || 'http://localhost:3000'

export const socket = io(SOCKET_URL, {
  autoConnect: false,
  reconnection: true,
  reconnectionAttempts: 5,
  reconnectionDelay: 1000,
})

export function connectSocket(sessionId) {
  if (!socket.connected) {
    socket.connect()
    socket.once('connect', () => {
      socket.emit('register', { sessionId })
    })
  } else {
    socket.emit('register', { sessionId })
  }
}

export function disconnectSocket() {
  socket.disconnect()
}
