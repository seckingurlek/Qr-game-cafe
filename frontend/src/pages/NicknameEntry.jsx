import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { api } from '../lib/api.js'
import { useStore } from '../lib/store.js'
import { connectSocket } from '../lib/socket.js'

export default function NicknameEntry() {
  const navigate = useNavigate()
  const { table, setTable, setSession } = useStore()
  const [nickname, setNickname] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  // Masa yoksa dev modunda geçici masa ata (lokal test için)
  const activeTable = table || { id: 'dev-table', table_number: 1, label: 'Geliştirici Masası', qr_code: 'dev' }

  async function handleSubmit() {
    const nick = nickname.trim()
    if (nick.length < 2) return setError('En az 2 karakter gir')
    if (nick.length > 20) return setError('En fazla 20 karakter')

    // Masa henüz store'da yoksa kaydet
    if (!table) setTable(activeTable)

    setLoading(true)
    setError('')
    try {
      const data = await api.createSession(nick, activeTable.id)
      setSession({
        ...data,
        tableNumber: activeTable.table_number,
        tableLabel: activeTable.label
      })
      connectSocket(data.sessionId)
      navigate('/games', { replace: true })
    } catch (err) {
      // Backend bağlı değilse bile dev modunda devam et
      if (activeTable.id === 'dev-table') {
        const devSession = {
          sessionId: `dev-${Date.now()}`,
          nickname: nick,
          tableId: 'dev-table',
          tableNumber: 1,
          tableLabel: 'Geliştirici Masası'
        }
        setSession(devSession)
        navigate('/games', { replace: true })
      } else {
        setError(err.message)
      }
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="page fade-in" style={{
      justifyContent: 'center',
      alignItems: 'center',
      gap: 24
    }}>
      <div style={{ textAlign: 'center' }}>
        <div style={{ fontSize: 56, marginBottom: 12 }}>🎮</div>
        <h1 style={{ fontSize: 26, fontWeight: 800 }}>Oyunlara Hoş Geldin!</h1>
        <p style={{ color: 'var(--text2)', marginTop: 8, fontSize: 14 }}>
          Bir nick seç ve oynamaya başla
        </p>
      </div>

      <span className="badge badge-table">
        📍 {activeTable.label || `Masa ${activeTable.table_number}`}
      </span>

      <div style={{ width: '100%' }}>
        <input
          className="input"
          placeholder="Nickini yaz... (örn: ShadowFox)"
          value={nickname}
          onChange={e => { setNickname(e.target.value); setError('') }}
          onKeyDown={e => e.key === 'Enter' && handleSubmit()}
          maxLength={20}
          autoFocus
          style={{ fontSize: 18, textAlign: 'center' }}
        />
        {error && (
          <p style={{ color: 'var(--accent)', fontSize: 13, marginTop: 8, textAlign: 'center' }}>
            {error}
          </p>
        )}
      </div>

      <button
        className="btn btn-primary"
        onClick={handleSubmit}
        disabled={loading || nickname.trim().length < 2}
        style={{ opacity: nickname.trim().length < 2 ? 0.5 : 1 }}
      >
        {loading ? 'Yükleniyor...' : 'Devam Et →'}
      </button>

      <button className="btn btn-ghost" onClick={() => navigate('/menu')}>
        ← Menüye Dön
      </button>
    </div>
  )
}
