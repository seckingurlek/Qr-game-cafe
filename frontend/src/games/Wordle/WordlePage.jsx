import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { api } from '../../lib/api.js'
import { useStore } from '../../lib/store.js'

// 5 harfli Türkçe kelimeler (örnek liste - genişletilebilir)
const WORDS = [
  'KALEM', 'KAPAK', 'KARGO', 'KADIN', 'KAHVE', 'KAMYON', 'KANAL',
  'ARABA', 'AYRAN', 'ASLAN', 'ALTIN', 'ALARM', 'ATLAS',
  'BALIK', 'BAHCE', 'BARIS', 'BEYAZ', 'BILEK', 'BULUT',
  'CAMLI', 'CEVAP', 'CICEK', 'CUMLE',
  'DUMAN', 'DENIZ', 'DOGRU', 'DUVAR',
  'EKMEK', 'ELMAS', 'ERKEN', 'ESMER',
  'FENER', 'FIDAN', 'FINCAN', 'FIRIN',
  'GUNES', 'GUMUS', 'GULUC', 'GITAR',
  'HABER', 'HAYAL', 'HASTA', 'HALUK',
  'INSAN', 'IZMIR', 'IRADE',
  'IZLEV', 'KAPLI', 'KOLAY', 'KUCUK',
  'LIMAN', 'LOPAK', 'LIMON',
  'MEYVE', 'MIRAS', 'MUTLU', 'MOTOR',
  'NEHIR', 'NISAN', 'NOKTA',
  'OYNAK', 'ORMAN', 'OSMAN',
  'PANEL', 'PASTA', 'PAZAR', 'PRENS',
  'RADYO', 'RENKL', 'RUSYA',
  'SABAH', 'SAKIN', 'SALON', 'SEZON', 'SINIR', 'SOMUN',
  'TABLO', 'TAKIM', 'TARAK', 'TAVAN', 'TARAF', 'TOPUZ',
  'UYKUN', 'ULKEN', 'UZMAN',
  'VAKIT', 'VATAN', 'VAZGE',
  'YABAN', 'YARIN', 'YAZAR', 'YILAN', 'YORUM',
  'ZAMAN', 'ZATEN', 'ZENGI'
].filter(w => w.length === 5)

const ALPHABET = 'ABCDEFGHIJKLMNOPRSTUVYZÇĞİÖŞÜ'.split('')

function getTileColor(letter, index, answer) {
  if (answer[index] === letter) return 'correct'
  if (answer.includes(letter)) return 'present'
  return 'absent'
}

export default function WordlePage() {
  const navigate = useNavigate()
  const session = useStore(s => s.session)
  const [answer] = useState(() => WORDS[Math.floor(Math.random() * WORDS.length)])
  const [guesses, setGuesses] = useState([])
  const [current, setCurrent] = useState('')
  const [status, setStatus] = useState('playing') // playing | won | lost
  const [shake, setShake] = useState(false)
  const [letterStates, setLetterStates] = useState({})

  const MAX = 6

  function addLetter(l) {
    if (current.length < 5 && status === 'playing') setCurrent(c => c + l)
  }

  function deleteLetter() {
    setCurrent(c => c.slice(0, -1))
  }

  function submit() {
    if (current.length < 5 || status !== 'playing') return

    // Kelime kontrolü (basit, tüm liste yerine uzunluk kontrolü)
    const guess = current.toUpperCase()
    const newGuesses = [...guesses, guess]
    setGuesses(newGuesses)
    setCurrent('')

    // Harf durumlarını güncelle
    const newStates = { ...letterStates }
    guess.split('').forEach((l, i) => {
      const color = getTileColor(l, i, answer)
      const priority = { correct: 3, present: 2, absent: 1 }
      if (!newStates[l] || priority[color] > priority[newStates[l]]) {
        newStates[l] = color
      }
    })
    setLetterStates(newStates)

    if (guess === answer) {
      setStatus('won')
      const score = (MAX - newGuesses.length + 1) * 100
      if (session) api.saveScore(session.sessionId, 'wordle', score, { guesses: newGuesses.length })
    } else if (newGuesses.length >= MAX) {
      setStatus('lost')
      if (session) api.saveScore(session.sessionId, 'wordle', 0)
    }
  }

  useEffect(() => {
    const handler = (e) => {
      if (status !== 'playing') return
      if (e.key === 'Enter') submit()
      else if (e.key === 'Backspace') deleteLetter()
      else if (/^[a-zA-ZÇçĞğİıÖöŞşÜü]$/.test(e.key)) {
        addLetter(e.key.toUpperCase())
      }
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [current, status, guesses])

  const COLORS = {
    correct: { bg: '#27ae60', border: '#27ae60' },
    present: { bg: '#f5a623', border: '#f5a623' },
    absent:  { bg: '#3a3a4a', border: '#3a3a4a' },
    default: { bg: 'var(--bg2)', border: 'var(--border)' },
    active:  { bg: 'var(--bg2)', border: 'var(--accent)' }
  }

  return (
    <div className="page fade-in" style={{ alignItems: 'center' }}>
      <div style={{ display:'flex', justifyContent:'space-between', width:'100%', marginBottom:16 }}>
        <button onClick={() => navigate('/games')} style={{ background:'none', border:'none', color:'var(--text2)', cursor:'pointer', fontSize:20 }}>←</button>
        <h2 style={{ fontWeight:800 }}>📝 Wordle TR</h2>
        <div />
      </div>

      {/* Izgara */}
      <div style={{ display:'flex', flexDirection:'column', gap:6, marginBottom:20 }}>
        {Array(MAX).fill(null).map((_, row) => {
          const guess = guesses[row]
          const isActive = row === guesses.length
          const word = isActive ? current.padEnd(5) : (guess || '     ')

          return (
            <div key={row} style={{ display:'flex', gap:6 }}>
              {word.split('').map((l, col) => {
                const letter = l.trim()
                const colorKey = guess ? getTileColor(letter, col, answer) : isActive && letter ? 'active' : 'default'
                const { bg, border } = COLORS[colorKey]
                return (
                  <div key={col} style={{
                    width: 54, height: 54,
                    background: bg,
                    border: `2px solid ${border}`,
                    borderRadius: 8,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontWeight: 800, fontSize: 22,
                    fontFamily: 'Space Mono',
                    transition: 'all 0.2s'
                  }}>
                    {letter}
                  </div>
                )
              })}
            </div>
          )
        })}
      </div>

      {/* Klavye */}
      <div style={{ width:'100%', maxWidth:360 }}>
        {[
          'QWERTYUIOP',
          'ASDFGHJKLİ',
          'ZXCVBNMÇŞÖÜĞ'
        ].map((row, ri) => (
          <div key={ri} style={{ display:'flex', justifyContent:'center', gap:4, marginBottom:4 }}>
            {ri === 2 && (
              <button onClick={submit} style={{
                background:'var(--accent)', color:'white', border:'none',
                borderRadius:6, padding:'0 10px', height:44,
                fontFamily:'Syne', fontWeight:700, fontSize:12, cursor:'pointer'
              }}>GİR</button>
            )}
            {row.split('').map(l => {
              const state = letterStates[l]
              const { bg, border } = COLORS[state || 'default']
              return (
                <button key={l} onClick={() => addLetter(l)} style={{
                  width: 30, height: 44,
                  background: bg, border: `1px solid ${border}`,
                  borderRadius: 6, color: 'var(--text)',
                  fontFamily: 'Syne', fontWeight: 700, fontSize: 13,
                  cursor: 'pointer', transition: 'all 0.2s'
                }}>{l}</button>
              )
            })}
            {ri === 2 && (
              <button onClick={deleteLetter} style={{
                background:'var(--bg3)', color:'var(--text)', border:'1px solid var(--border)',
                borderRadius:6, padding:'0 10px', height:44,
                fontFamily:'Syne', fontWeight:700, fontSize:16, cursor:'pointer'
              }}>⌫</button>
            )}
          </div>
        ))}
      </div>

      {/* Sonuç */}
      {status !== 'playing' && (
        <div className="card" style={{ marginTop:20, textAlign:'center', width:'100%' }}>
          <p style={{ fontSize:36, marginBottom:8 }}>{status === 'won' ? '🎉' : '😔'}</p>
          <p style={{ fontWeight:800, fontSize:20 }}>
            {status === 'won' ? `${guesses.length} tahminle buldun!` : `Cevap: ${answer}`}
          </p>
          <button className="btn btn-primary" onClick={() => window.location.reload()} style={{ marginTop:16 }}>
            Yeni Kelime
          </button>
        </div>
      )}
    </div>
  )
}
