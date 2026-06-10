import { useState, useEffect, useCallback, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { api } from '../../lib/api.js'
import { useStore } from '../../lib/store.js'

const COLS = 20, ROWS = 20
const CELL = 16
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

      setFood(f => {
        if (head[0]===f[0] && head[1]===f[1]) {
          setScore(s => s + 10)
          const newSnake = [head, ...prev]
          const newFood = randFood(newSnake)
          setFood(newFood)
          return newFood
        }
        return f
      })

      return [head, ...prev.slice(0, -1)]
    })
  }, [])

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
    <div className="page" style={{ alignItems: 'center', paddingTop: 16 }}
      onTouchStart={onTouchStart} onTouchEnd={onTouchEnd}>
      <div style={{ display: 'flex', justifyContent: 'space-between', width: '100%', marginBottom: 16 }}>
        <button onClick={() => navigate('/games')} style={{
          background: 'none', border: 'none', color: 'var(--text2)', cursor: 'pointer', fontSize: 20
        }}>←</button>
        <h2 style={{ fontWeight: 800 }}>🐍 Snake</h2>
        <span style={{ fontFamily: 'Space Mono', color: 'var(--accent2)', fontWeight: 700 }}>
          {score}
        </span>
      </div>

      {/* Canvas */}
      <div style={{
        position: 'relative',
        width: COLS*CELL,
        height: ROWS*CELL,
        background: 'var(--bg2)',
        border: '2px solid var(--border)',
        borderRadius: 8
      }}>
        {snake.map(([x,y], i) => (
          <div key={i} style={{
            position: 'absolute',
            left: x*CELL, top: y*CELL,
            width: CELL-1, height: CELL-1,
            background: i === 0 ? '#27ae60' : '#2ecc71',
            borderRadius: i === 0 ? 4 : 2
          }} />
        ))}
        <div style={{
          position: 'absolute',
          left: food[0]*CELL, top: food[1]*CELL,
          width: CELL-1, height: CELL-1,
          background: 'var(--accent)',
          borderRadius: '50%'
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

      {/* D-pad mobil için */}
      {status === 'playing' && (
        <div style={{ marginTop: 24, display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 8 }}>
          {[
            [null], ['UP', '↑'], [null],
            ['LEFT', '←'], ['DOWN', '↓'], ['RIGHT', '→']
          ].flat().map((btn, i) => btn ? (
            <button key={i} onTouchStart={() => {
              const map = { UP:[0,-1], DOWN:[0,1], LEFT:[-1,0], RIGHT:[1,0] }
              const [nx, ny] = map[btn[0]]
              const [cx, cy] = dirRef.current
              if (nx !== -cx || ny !== -cy) dirRef.current = [nx, ny]
            }}
            style={{
              background: 'var(--bg3)', border: '1px solid var(--border)',
              borderRadius: 8, padding: '16px', fontSize: 20, cursor: 'pointer', color: 'var(--text)'
            }}>
              {btn[1]}
            </button>
          ) : <div key={i} />)}
        </div>
      )}

      <button className="btn btn-ghost" onClick={() => navigate('/leaderboard/snake')} style={{ marginTop: 16, width: 'auto' }}>
        🏆 Skor Tablosu
      </button>
    </div>
  )
}
