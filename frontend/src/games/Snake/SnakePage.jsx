import { useState, useEffect, useCallback, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { api } from '../../lib/api.js'
import { useStore } from '../../lib/store.js'
import { useGameScrollLock } from '../../lib/hooks/useGameScrollLock.js'

const COLS = 20, ROWS = 20
const CELL = 20
const DIRS = { UP: [0,-1], DOWN: [0,1], LEFT: [-1,0], RIGHT: [1,0] }

function randFood(snake) {
  let pos
  do {
    pos = [Math.floor(Math.random()*COLS), Math.floor(Math.random()*ROWS)]
  } while (snake.some(s => s[0]===pos[0] && s[1]===pos[1]))
  return pos
}

export default function SnakePage() {
  const navigate = useNavigate()
  const session = useStore(s => s.session)
  const [snake, setSnake] = useState([[10,10],[9,10],[8,10]])
  const [dir, setDir] = useState([1,0])
  const [food, setFood] = useState([15,10])
  const [score, setScore] = useState(0)
  const [status, setStatus] = useState('idle') // idle | playing | dead
  const dirRef = useRef([1,0])
  const intervalRef = useRef(null)

  // Scroll kilidi - oyun içinde (idle, playing, dead) her zaman aktif
  // Component unmount olduğunda otomatik temizlenir
  useGameScrollLock(true)

  const tick = useCallback(() => {
    setSnake(prev => {
      const [dx, dy] = dirRef.current
      const head = [prev[0][0]+dx, prev[0][1]+dy]

      // Duvar çarpışması
      if (head[0]<0||head[0]>=COLS||head[1]<0||head[1]>=ROWS) {
        setStatus('dead')
        return prev
      }
      // Kendine çarpma
      if (prev.some(s => s[0]===head[0] && s[1]===head[1])) {
        setStatus('dead')
        return prev
      }

      // Yem yenildi mi?
      const ateFood = head[0] === food[0] && head[1] === food[1]

      if (ateFood) {
        setScore(s => s + 10)
        const newSnake = [head, ...prev]
        setFood(randFood(newSnake))
        return newSnake // Kuyruk silinmez, yılan büyür!
      }

      return [head, ...prev.slice(0, -1)] // Normal hareket, kuyruk silinir
    })
  }, [food])

  useEffect(() => {
    if (status === 'playing') {
      intervalRef.current = setInterval(tick, 120)
    } else {
      clearInterval(intervalRef.current)
      if (status === 'dead' && session) {
        api.saveScore(session.sessionId, 'snake', score)
      }
    }
    return () => clearInterval(intervalRef.current)
  }, [status, tick])

  useEffect(() => {
    const handler = (e) => {
      if (status !== 'playing') return
      const map = {
        ArrowUp: [0,-1], ArrowDown: [0,1],
        ArrowLeft: [-1,0], ArrowRight: [1,0]
      }
      if (map[e.key]) {
        e.preventDefault()
        const [nx, ny] = map[e.key]
        const [cx, cy] = dirRef.current
        if (nx !== -cx || ny !== -cy) dirRef.current = map[e.key]
      }
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [status])

  function start() {
    setSnake([[10,10],[9,10],[8,10]])
    setDir([1,0])
    dirRef.current = [1,0]
    setFood(randFood([[10,10],[9,10],[8,10]]))
    setScore(0)
    setStatus('playing')
  }

  // Swipe kontrol
  const touchStart = useRef(null)
  function onTouchStart(e) { touchStart.current = e.touches[0] }
  function onTouchEnd(e) {
    if (!touchStart.current || status !== 'playing') return
    const dx = e.changedTouches[0].clientX - touchStart.current.clientX
    const dy = e.changedTouches[0].clientY - touchStart.current.clientY
    const [cx, cy] = dirRef.current
    if (Math.abs(dx) > Math.abs(dy)) {
      const nd = dx > 0 ? [1,0] : [-1,0]
      if (nd[0] !== -cx) dirRef.current = nd
    } else {
      const nd = dy > 0 ? [0,1] : [0,-1]
      if (nd[1] !== -cy) dirRef.current = nd
    }
  }

  return (
    <div className="page" style={{ alignItems: 'center', paddingTop: 16 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', width: '100%', marginBottom: 16 }}>
        <button onClick={() => navigate('/games')} style={{
          background: 'none', border: 'none', color: 'var(--text2)', cursor: 'pointer', fontSize: 20
        }}>←</button>
        <h2 style={{ fontWeight: 800 }}>🐍 Snake</h2>
        <span style={{ fontFamily: 'Space Mono', color: 'var(--accent2)', fontWeight: 700 }}>
          {score}
        </span>
      </div>

      {/* Canvas - Swipe sadece burada çalışır */}
      <div
        onTouchStart={onTouchStart}
        onTouchEnd={onTouchEnd}
        style={{
          position: 'relative',
          width: `min(${COLS*CELL}px, 90vw)`,
          height: `min(${ROWS*CELL}px, 90vw)`,
          background: 'var(--bg2)',
          border: '2px solid var(--border)',
          borderRadius: 8,
          overscrollBehavior: 'none' // Ekstra güvenlik - pull-to-refresh engelle
        }}>
        {snake.map(([x,y], i) => (
          <div key={i} style={{
            position: 'absolute',
            left: `${(x / COLS) * 100}%`,
            top: `${(y / ROWS) * 100}%`,
            width: `${100 / COLS}%`,
            height: `${100 / ROWS}%`,
            background: i === 0 ? '#27ae60' : '#2ecc71',
            borderRadius: i === 0 ? 4 : 2,
            boxSizing: 'border-box'
          }} />
        ))}
        <div style={{
          position: 'absolute',
          left: `${(food[0] / COLS) * 100}%`,
          top: `${(food[1] / ROWS) * 100}%`,
          width: `${100 / COLS}%`,
          height: `${100 / ROWS}%`,
          background: 'var(--accent)',
          borderRadius: '50%',
          boxSizing: 'border-box'
        }} />

        {status !== 'playing' && (
          <div style={{
            position: 'absolute', inset: 0,
            background: 'rgba(0,0,0,0.7)',
            display: 'flex', flexDirection: 'column',
            alignItems: 'center', justifyContent: 'center',
            gap: 12, borderRadius: 6
          }}>
            {status === 'dead' && (
              <>
                <p style={{ fontWeight: 800, fontSize: 20 }}>💀 Oyun Bitti</p>
                <p style={{ color: 'var(--accent2)', fontFamily: 'Space Mono' }}>Skor: {score}</p>
              </>
            )}
            <button className="btn btn-primary" onClick={start} style={{ width: 'auto', padding: '10px 24px' }}>
              {status === 'dead' ? 'Tekrar Oyna' : 'Başla'}
            </button>
          </div>
        )}
      </div>

      {/* Yön Tuşları - Mobil ve Masaüstü */}
      <div style={{ marginTop: 20, display: 'grid', gridTemplateColumns: 'repeat(3, 65px)', gap: 16, justifyItems: 'center' }}>
        {[
            null,
            'UP',
            null,
            'LEFT',
            'DOWN',
            'RIGHT'
          ].flat().map((btn, i) => btn ? (
          <button
            key={i}
            onPointerDown={(e) => {
              e.preventDefault()
              e.stopPropagation()
              if (status !== 'playing') return
              const map = { UP:[0,-1], DOWN:[0,1], LEFT:[-1,0], RIGHT:[1,0] }
              const [nx, ny] = map[btn]
              const [cx, cy] = dirRef.current
              if (nx !== -cx || ny !== -cy) dirRef.current = [nx, ny]
            }}
            style={{
              width: 60, height: 60,
              background: status === 'playing' ? 'var(--bg3)' : 'var(--bg2)',
              border: '2px solid var(--accent)',
              borderRadius: 12,
              opacity: status === 'playing' ? 1 : 0.5,
              cursor: status === 'playing' ? 'pointer' : 'not-allowed',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: 28, fontWeight: 'bold',
              userSelect: 'none',
              touchAction: 'none'
            }}
          >
            {btn === 'UP' && '▲'}
            {btn === 'DOWN' && '▼'}
            {btn === 'LEFT' && '◀'}
            {btn === 'RIGHT' && '▶'}
          </button>
        ) : <div key={i} />)}
      </div>

      {status === 'dead' && (
        <button className="btn btn-ghost" onClick={() => navigate('/leaderboard/snake')} style={{ marginTop: 16, width: 'auto' }}>
          🏆 Skor Tablosu
        </button>
      )}
    </div>
  )
}
