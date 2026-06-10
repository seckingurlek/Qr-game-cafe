import pg from 'pg'
const { Pool } = pg

export const db = new Pool({
  connectionString: process.env.DATABASE_URL,
  max: 20,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 2000,
})

db.on('error', (err) => {
  console.error('PostgreSQL pool error:', err)
})

// Test bağlantısı
try {
  const client = await db.connect()
  console.log('✅ PostgreSQL connected')
  client.release()
} catch (err) {
  console.error('❌ PostgreSQL connection failed:', err.message)
}
