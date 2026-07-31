import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { api } from '../lib/api.js'
import { useStore } from '../lib/store.js'

export default function TableEntry() {
  const { qrCode } = useParams()
  const navigate = useNavigate()
  const setTable = useStore(s => s.setTable)
  const [error, setError] = useState(null)

  useEffect(() => {
    console.log('QR Code:', qrCode)
    api.getTableByQR(qrCode)
      .then(table => {
        console.log('Table found:', table)
        setTable(table)
        navigate('/menu', { replace: true })
      })
      .catch(err => {
        console.error('Error:', err)
        setError('Bu QR kodu geçersiz.')
      })
  }, [qrCode])

  if (error) return (
    <div className="page" style={{ alignItems: 'center', justifyContent: 'center', textAlign: 'center' }}>
      <div style={{ fontSize: 48, marginBottom: 16 }}>❌</div>
      <p style={{ color: 'var(--text2)' }}>{error}</p>
    </div>
  )

  return (
    <div className="page" style={{ alignItems: 'center', justifyContent: 'center' }}>
      <div style={{ fontSize: 48, marginBottom: 16 }}>☕</div>
      <p style={{ color: 'var(--text2)' }}>Yükleniyor...</p>
    </div>
  )
}
