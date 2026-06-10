export default async function scoresRouter(app) {
  const { db } = app

  // Skor kaydet
  app.post('/', async (req, reply) => {
    const { sessionId, gameSlug, score, meta } = req.body

    if (!sessionId || !gameSlug || score === undefined) {
      return reply.code(400).send({ error: 'sessionId, gameSlug, score zorunlu' })
    }

    const result = await db.query(
      `INSERT INTO scores (session_id, game_slug, score, meta)
       VALUES ($1, $2, $3, $4) RETURNING *`,
      [sessionId, gameSlug, score, meta ? JSON.stringify(meta) : null]
    )

    return result.rows[0]
  })

  // Leaderboard - oyuna göre en yüksek skorlar
  app.get('/leaderboard/:gameSlug', async (req, reply) => {
    const { gameSlug } = req.params
    const limit = parseInt(req.query.limit) || 10

    const result = await db.query(
      `SELECT 
         s.nickname,
         t.table_number,
         t.label as table_label,
         sc.score,
         sc.created_at
       FROM scores sc
       JOIN sessions s ON sc.session_id = s.id
       JOIN tables t ON s.table_id = t.id
       WHERE sc.game_slug = $1
       ORDER BY sc.score DESC
       LIMIT $2`,
      [gameSlug, limit]
    )

    return result.rows
  })

  // Global leaderboard - tüm oyunlar
  app.get('/leaderboard', async (req, reply) => {
    const result = await db.query(
      `SELECT 
         sc.game_slug,
         s.nickname,
         t.table_number,
         MAX(sc.score) as best_score,
         COUNT(*) as play_count
       FROM scores sc
       JOIN sessions s ON sc.session_id = s.id
       JOIN tables t ON s.table_id = t.id
       GROUP BY sc.game_slug, s.nickname, t.table_number
       ORDER BY sc.game_slug, best_score DESC`
    )

    // Oyuna göre grupla
    const grouped = {}
    for (const row of result.rows) {
      if (!grouped[row.game_slug]) grouped[row.game_slug] = []
      grouped[row.game_slug].push(row)
    }

    return grouped
  })
}
