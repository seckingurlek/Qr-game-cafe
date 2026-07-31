import { useState, useEffect, useCallback, useRef } from 'react'
import { useStore } from '../../../lib/store.js'
import { chatSocketManager } from '../services/chatSocketManager.js'
import { ChatLimits } from '../constants/messageTypes.js'
import { socket } from '../../../lib/socket.js'

export function useChat(roomId) {
  const [messages, setMessages] = useState([])
  const [typingUsers, setTypingUsers] = useState(new Set())
  const [isOpen, setIsOpen] = useState(false)
  const [unreadCount, setUnreadCount] = useState(0)
  const session = useStore(s => s.session)
  const isTypingRef = useRef(false)
  const cleanupRef = useRef(null)

  // Room'a katıl
  useEffect(() => {
    if (!roomId || !session?.sessionId) return

    // Callback'i kaydet
    cleanupRef.current = chatSocketManager.onRoomEvent(roomId, (event, data) => {
      switch (event) {
        case 'message':
          setMessages(prev => {
            // Duplicate kontrolü
            if (prev.some(m => m.id === data.id)) return prev
            const newMessages = [...prev, data]
            // Limit
            if (newMessages.length > ChatLimits.MAX_MESSAGES_IN_MEMORY) {
              return newMessages.slice(-ChatLimits.MAX_MESSAGES_IN_MEMORY)
            }
            return newMessages
          })

          // Chat kapalıyken unread artır
          if (!isOpen) {
            setUnreadCount(prev => prev + 1)
          }
          break

        case 'typing':
          setTypingUsers(prev => new Set([...prev, data.userId]))
          break

        case 'stoppedTyping':
          setTypingUsers(prev => {
            const next = new Set(prev)
            next.delete(data.userId)
            return next
          })
          break

        case 'userJoined':
          setMessages(prev => [...prev, {
            id: `system-${Date.now()}`,
            type: 'system',
            message: `${data.nickname} katıldı`,
            createdAt: new Date().toISOString()
          }])
          break

        case 'userLeft':
          setMessages(prev => [...prev, {
            id: `system-${Date.now()}`,
            type: 'system',
            message: `${data.nickname} ayrıldı`,
            createdAt: new Date().toISOString()
          }])
          break
      }
    })

    // Room'a katıl
    chatSocketManager.joinRoom(roomId, session.sessionId)

    return () => {
      if (cleanupRef.current) {
        cleanupRef.current()
      }
      chatSocketManager.leaveRoom(roomId)
    }
  }, [roomId, session?.sessionId])

  // Mesaj gönder
  const sendMessage = useCallback((message) => {
    if (!message.trim() || !session?.sessionId) return

    chatSocketManager.sendMessage(roomId, message, session.sessionId)

    // Backend üzerinden gelecek, lokal olarak eklemiyoruz
  }, [roomId, session?.sessionId])

  // Typing başlat
  const startTyping = useCallback(() => {
    if (isTypingRef.current || !session?.sessionId) return
    isTypingRef.current = true
    chatSocketManager.startTyping(roomId, session.sessionId)
  }, [roomId, session?.sessionId])

  // Typing durdur
  const stopTyping = useCallback(() => {
    if (!isTypingRef.current) return
    isTypingRef.current = false
    chatSocketManager.stopTyping(roomId, session.sessionId)
  }, [roomId, session?.sessionId])

  // Chat aç/kapa
  const toggleChat = useCallback(() => {
    setIsOpen(prev => {
      if (prev) {
        // Kapanırken unread sıfırla
        setUnreadCount(0)
      }
      return !prev
    })
  }, [])

  return {
    messages,
    typingUsers: Array.from(typingUsers),
    unreadCount,
    isOpen,
    toggleChat,
    sendMessage,
    startTyping,
    stopTyping,
    isConnected: socket?.connected || false
  }
}
