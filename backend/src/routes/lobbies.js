export default async function lobbiesRouter(app) {
  const { db } = app

  // Bekleyen lobileri listele (oyuna göre)
  app.get('/:gameSlug/waiting', async (req, reply) => {
    const result = await db.query(
      `SELECT 
         gl.id,
         gl.game_slug,
         gl.status,
         gl.created_at,
         s.nickname as host_nickname,
         t.table_number as host_table_number
       FROM game_lobbies gl
       JOIN sessions s ON gl.host_session_id = s.id
       JOIN tables t ON s.table_id = t.id
       WHERE gl.game_slug = $1 AND gl.status = 'waiting'
       ORDER BY gl.created_at ASC`,
      [req.params.gameSlug]
    )
    return result.rows
  })

  // Lobi oluştur
  app.post('/', async (req, reply) => {
    const { gameSlug, hostSessionId } = req.body

    // Zaten açık lobi var mı?
    const existing = await db.query(
      `SELECT id FROM game_lobbies 
       WHERE host_session_id = $1 AND status = 'waiting'`,
      [hostSessionId]
    )
    if (existing.rows[0]) {
      return { lobbyId: existing.rows[0].id, status: 'waiting' }
    }

    const result = await db.query(
      `INSERT INTO game_lobbies (game_slug, host_session_id)
       VALUES ($1, $2) RETURNING id`,
      [gameSlug, hostSessionId]
    )

    return { lobbyId: result.rows[0].id, status: 'waiting' }
  })

  // Lobiye katıl
  app.post('/:lobbyId/join', async (req, reply) => {
    const { guestSessionId } = req.body
    const { lobbyId } = req.params

    const lobby = await db.query(
      'SELECT * FROM game_lobbies WHERE id = $1 AND status = $2',
      [lobbyId, 'waiting']
    )

    if (!lobby.rows[0]) {
      return reply.code(404).send({ error: 'Lobi bulunamadı veya dolu' })
    }
    if (lobby.rows[0].host_session_id === guestSessionId) {
      return reply.code(400).send({ error: 'Kendi lobine katılamazsın' })
    }

    await db.query(
      `UPDATE game_lobbies 
       SET guest_session_id = $1, status = 'playing', started_at = NOW()
       WHERE id = $2`,
      [guestSessionId, lobbyId]
    )

    return { lobbyId, status: 'playing' }
  })
}
