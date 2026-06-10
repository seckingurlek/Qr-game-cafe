import { createClient } from 'redis'

export const redis = createClient({
  url: process.env.REDIS_URL || 'redis://localhost:6379'
})

redis.on('error', (err) => console.error('Redis error:', err))
redis.on('connect', () => console.log('✅ Redis connected'))

await redis.connect()

// Redis yardımcı fonksiyonlar
export const RedisKeys = {
  lobby: (id) => `lobby:${id}`,           // lobi state
  game: (id) => `game:${id}`,             // oyun tahtası
  onlinePlayers: () => 'online:players',  // aktif oyuncular
  playerSocket: (sessionId) => `socket:${sessionId}`, // session → socket eşleşmesi
}
