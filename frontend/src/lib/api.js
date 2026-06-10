const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000'

async function request(path, options = {}) {
  const res = await fetch(`${API_URL}${path}`, {
    headers: { 'Content-Type': 'application/json' },
    ...options,
    body: options.body ? JSON.stringify(options.body) : undefined
  })
  if (!res.ok) {
    const err = await res.json().catch(() => ({}))
    throw new Error(err.error || 'İstek başarısız')
  }
  return res.json()
}

export const api = {
  // Masa
  getTableByQR: (qrCode) => request(`/api/tables/qr/${qrCode}`),

  // Session
  createSession: (nickname, tableId) =>
    request('/api/sessions', { method: 'POST', body: { nickname, tableId } }),

  // Skorlar
  saveScore: (sessionId, gameSlug, score, meta) =>
    request('/api/scores', { method: 'POST', body: { sessionId, gameSlug, score, meta } }),
  getLeaderboard: (gameSlug, limit = 10) =>
    request(`/api/scores/leaderboard/${gameSlug}?limit=${limit}`),
  getAllLeaderboards: () => request('/api/scores/leaderboard'),

  // Lobiler
  getWaitingLobbies: (gameSlug) => request(`/api/lobbies/${gameSlug}/waiting`),
}
