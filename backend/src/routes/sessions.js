export default async function sessionsRouter(app) {
  const { db } = app

  // Yeni session oluştur (nick + masa)
  app.post('/', async (req, reply) => {
    const { nickname, tableId } = req.body

    if (!nickname || !tableId) {
      return reply.code(400).send({ error: 'nickname ve tableId zorunlu' })
    }
    if (nickname.length < 2 || nickname.length > 20) {
      return reply.code(400).send({ error: 'Nick 2-20 karakter olmalı' })
    }

    // Aynı masada aynı nick varsa güncelle
    const existing = await db.query(
      `SELECT id FROM sessions 
       WHERE nickname = $1 AND table_id = $2 AND is_active = true`,
      [nickname.trim(), tableId]
    )

    if (existing.rows[0]) {
      await db.query(
        'UPDATE sessions SET last_seen = NOW() WHERE id = $1',
        [existing.rows[0].id]
      )
      return { sessionId: existing.rows[0].id, nickname: nickname.trim(), tableId }
    }

    const result = await db.query(
      `INSERT INTO sessions (nickname, table_id) 
       VALUES ($1, $2) RETURNING id`,
      [nickname.trim(), tableId]
    )

    return {
      sessionId: result.rows[0].id,
      nickname: nickname.trim(),
      tableId
    }
  })

  // Session bilgisi getir
  app.get('/:sessionId', async (req, reply) => {
    const result = await db.query(
      `SELECT s.*, t.table_number, t.label as table_label
       FROM sessions s
       JOIN tables t ON s.table_id = t.id
       WHERE s.id = $1`,
      [req.params.sessionId]
    )
    if (!result.rows[0]) {
      return reply.code(404).send({ error: 'Session bulunamadı' })
    }
    return result.rows[0]
  })
}
