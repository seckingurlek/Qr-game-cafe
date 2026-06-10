export default async function tablesRouter(app) {
  const { db } = app

  // QR koddan masa bilgisi getir
  app.get('/qr/:qrCode', async (req, reply) => {
    const { qrCode } = req.params
    const result = await db.query(
      'SELECT * FROM tables WHERE qr_code = $1',
      [qrCode]
    )
    if (!result.rows[0]) {
      return reply.code(404).send({ error: 'Masa bulunamadı' })
    }
    return result.rows[0]
  })

  // Tüm masaları listele
  app.get('/', async () => {
    const result = await db.query('SELECT * FROM tables ORDER BY table_number')
    return result.rows
  })
}
