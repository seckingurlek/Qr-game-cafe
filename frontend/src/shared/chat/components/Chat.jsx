import { useState } from 'react'
import { useChat } from '../hooks/useChat.js'
import { ChatLimits } from '../constants/messageTypes.js'
import './Chat.css'

// Chat Message Component
function ChatMessage({ message }) {
  if (message.type === 'system') {
    return (
      <div className="chat-message chat-message-system">
        {message.message}
      </div>
    )
  }

  const isOwn = message.isLocal

  return (
    <div className={`chat-message ${isOwn ? 'chat-message-own' : 'chat-message-other'}`}>
      <div className="chat-message-content">
        {!isOwn && (
          <span className="chat-message-sender">{message.senderName}</span>
        )}
        <span className="chat-message-text">{message.message}</span>
        <span className="chat-message-time">
          {new Date(message.createdAt).toLocaleTimeString('tr-TR', {
            hour: '2-digit',
            minute: '2-digit'
          })}
        </span>
      </div>
    </div>
  )
}

export default function Chat({ roomId, position = 'bottom-right' }) {
  const {
    messages,
    typingUsers,
    unreadCount,
    isOpen,
    toggleChat,
    sendMessage,
    startTyping,
    stopTyping
  } = useChat(roomId)

  const [inputValue, setInputValue] = useState('')

  const handleSend = () => {
    if (inputValue.trim()) {
      sendMessage(inputValue)
      setInputValue('')
      stopTyping()
    }
  }

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSend()
    }
  }

  const handleInputChange = (e) => {
    const value = e.target.value
    if (value.length <= ChatLimits.MAX_MESSAGE_LENGTH) {
      setInputValue(value)
      if (value.length > 0) {
        startTyping()
      } else {
        stopTyping()
      }
    }
  }

  return (
    <div className={`chat-container chat-${position}`}>
      {/* Chat Panel */}
      {isOpen && (
        <div className="chat-panel">
          {/* Header */}
          <div className="chat-header">
            <span className="chat-title">💬 Sohbet</span>
            <button onClick={toggleChat} className="chat-close-btn">×</button>
          </div>

          {/* Messages */}
          <div className="chat-messages">
            {messages.length === 0 ? (
              <div className="chat-empty">
                <p>👋 Henüz mesaj yok</p>
                <p style={{ fontSize: 12, opacity: 0.7 }}>İlk mesajı sen gönder!</p>
              </div>
            ) : (
              messages.map(msg => (
                <ChatMessage key={msg.id} message={msg} />
              ))
            )}

            {/* Typing Indicator */}
            {typingUsers.length > 0 && (
              <div className="chat-typing">
                <span className="typing-dots">
                  <span></span>
                  <span></span>
                  <span></span>
                </span>
                <span style={{ fontSize: 11, opacity: 0.7 }}>Rakip yazıyor...</span>
              </div>
            )}
          </div>

          {/* Input */}
          <div className="chat-input-wrapper">
            <input
              type="text"
              value={inputValue}
              onChange={handleInputChange}
              onKeyDown={handleKeyDown}
              placeholder="Mesaj yaz..."
              className="chat-input"
              maxLength={ChatLimits.MAX_MESSAGE_LENGTH}
            />
            <button
              onClick={handleSend}
              disabled={!inputValue.trim()}
              className="chat-send-btn"
            >
              ➤
            </button>
          </div>

          {/* Character Count */}
          <div className="chat-char-count">
            {inputValue.length}/{ChatLimits.MAX_MESSAGE_LENGTH}
          </div>
        </div>
      )}

      {/* Toggle Button */}
      <button onClick={toggleChat} className="chat-toggle-btn">
        {isOpen ? '▼' : '💬'}
        {unreadCount > 0 && !isOpen && (
          <span className="chat-badge">{unreadCount}</span>
        )}
      </button>
    </div>
  )
}
