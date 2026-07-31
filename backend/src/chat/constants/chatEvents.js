// Chat Socket Events - Backend

// Client → Server
export const ClientChatEvents = {
  JOIN_ROOM: 'chat:room:join',
  LEAVE_ROOM: 'chat:room:leave',
  SEND_MESSAGE: 'chat:message:send',
  START_TYPING: 'chat:typing:start',
  STOP_TYPING: 'chat:typing:stop'
}

// Server → Client
export const ServerChatEvents = {
  CONNECTED: 'chat:connected',
  DISCONNECTED: 'chat:disconnected',
  ERROR: 'chat:error',
  ROOM_JOINED: 'chat:room:joined',
  ROOM_LEFT: 'chat:room:left',
  MESSAGE_RECEIVED: 'chat:message:received',
  HISTORY_LOADED: 'chat:history:loaded',
  USER_TYPING: 'chat:user:typing',
  USER_STOPPED_TYPING: 'chat:user:stopped_typing',
  USER_JOINED: 'chat:user:joined',
  USER_LEFT: 'chat:user:left'
}
