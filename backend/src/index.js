import './env.js'
import Fastify from 'fastify'
import { Server } from 'socket.io'
import cors from '@fastify/cors'
import fp from 'fastify-plugin'
import { db } from './db/postgres.js'
import { redis } from './db/redis.js'
import tablesRouter from './routes/tables.js'
import sessionsRouter from './routes/sessions.js'
import scoresRouter from './routes/scores.js'
import lobbiesRouter from './routes/lobbies.js'
import { registerSocketHandlers } from './socket/index.js'

const PORT = process.env.PORT || 3000

// Fastify - serverFactory ile Socket.io'yu aynı porta bağla
const app = Fastify({ logger: true })

// db ve redis'i tüm route'lara inject et
await app.register(fp(async (fastify) => {
  fastify.decorate('db', db)
  fastify.decorate('redis', redis)
}))

// CORS
await app.register(cors, {
  origin: process.env.CORS_ORIGIN || 'http://localhost:5173',
  methods: ['GET', 'POST', 'PUT', 'DELETE']
})

// Routes
await app.register(tablesRouter,   { prefix: '/api/tables' })
await app.register(sessionsRouter, { prefix: '/api/sessions' })
await app.register(scoresRouter,   { prefix: '/api/scores' })
await app.register(lobbiesRouter,  { prefix: '/api/lobbies' })

// Health check
app.get('/health', async () => ({ status: 'ok', timestamp: new Date().toISOString() }))

// Fastify'ı başlat
await app.listen({ port: PORT, host: '0.0.0.0' })
console.log(`🚀 Cafe Games Backend running on port ${PORT}`)

// Socket.io'yu Fastify'ın kendi HTTP serverına bağla
const io = new Server(app.server, {
  cors: {
    origin: process.env.CORS_ORIGIN || 'http://localhost:5173',
    methods: ['GET', 'POST']
  }
})

// Socket handlers
registerSocketHandlers(io, db, redis)
