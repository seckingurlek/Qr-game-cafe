import { useState, useEffect, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { api } from '../../lib/api.js'
import { useStore } from '../../lib/store.js'

function createBoard() { return Array(4).fill(null).map(() => Array(4).fill(0)) }

function addRandom(board) {
  const empty = []
  board.forEach((row, r) => row.forEach((v, c) => { if (!v) empty.push([r,c]) }))
  if (!empty.length) return board
  const [r, c] = empty[Math.floor(Math.random()*empty.length)]
  const nb = board.map(row => [...row])
  nb[r][c] = Math.random() < 0.9 ? 2 : 4
  return nb
}

function slide(row) {
  let arr = row.filter(v => v)
  let score = 0
  for (let i = 0; i < arr.length - 1; i++) {
    if (arr[i] === arr[i+1]) {
      arr[i] *= 2; score += arr[i]; arr[i+1] = 0
    }
  }
  arr = arr.filter(v => v)
  while (arr.length < 4) arr.push(0)
  return { row: arr, score }
}

function move(board, dir) {
  let nb = board.map(r => [...r])
  let totalScore = 0
  let moved = false

  if (dir === 'left') {
    nb = nb.map(row => { const {row:r,score:s} = slide(row); totalScore+=s; if(r.join()!==row.join()) moved=true; return r })
  } else if (dir === 'right') {
    nb = nb.map(row => { const rev = [...row].reverse(); const {row:r,score:s} = slide(rev); totalScore+=s; const rr=r.reverse(); if(rr.join()!==row.join()) moved=true; return rr })
  } else if (dir === 'up') {
    for (let c=0;c<4;c++) {
      const col = nb.map(r=>r[c])
      const {row:r,score:s} = slide(col); totalScore+=s
      r.forEach((v,ri) => { if(nb[ri][c]!==v) moved=true; nb[ri][c]=v })
    }
  } else if (dir === 'down') {
    for (let c=0;c<4;c++) {
      const col = nb.map(r=>r[c]).reverse()
      const {row:r,score:s} = slide(col); totalScore+=s
      r.reverse().forEach((v,ri) => { if(nb[ri][c]!==v) moved=true; nb[ri][c]=v })
    }
  }

  return { board: moved ? addRandom(nb) : nb, score: totalScore, moved }
}

const COLORS = {
  0:'#1a1a2e', 2:'#eee4da', 4:'#ede0c8', 8:'#f2b179',
  16:'#f59563', 32:'#f67c5f', 64:'#f65e3b',
  128:'#edcf72', 256:'#edcc61', 512:'#edc850',
  1024:'#edc53f', 2048:'#edc22e'
}

export default function Game2048Page() {
  const navigate = useNavigate()
  const session = useStore(s => s.session)
  const [board, setBoard] = useState(() => addRandom(addRandom(createBoard())))
  const [score, setScore] = useState(0)
  const [best, setBest] = useState(0)
  const [status, setStatus] = useState('playing')

  function handleMove(dir) {
    if (status !== 'playing') return
    setBoard(prev => {
      const { board: nb, score: s, moved } = move(prev, dir)
      if (!moved) return prev
      setScore(sc => { const ns = sc+s; setBest(b => Math.max(b,ns)); return ns })
      // Check lose
      const canMove = ['left','right','up','down'].some(d => move(nb,d).moved)
      if (!canMove) {
        setStatus('over')
        if (session) api.saveScore(session.sessionId, '2048', score+s)
      }
      return nb
    })
  }

  useEffect(() => {
    const handler = (e) => {
      const map = { ArrowLeft:'left', ArrowRight:'right', ArrowUp:'up', ArrowDown:'down' }
      if (map[e.key]) { e.preventDefault(); handleMove(map[e.key]) }
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [status])

  const touchStart = { x: 0, y: 0 }
  function onTouchStart(e) { touchStart.x = e.touches[0].clientX; touchStart.y = e.touches[0].clientY }
  function onTouchEnd(e) {
    const dx = e.changedTouches[0].clientX - touchStart.x
    const dy = e.changedTouches[0].clientY - touchStart.y
    if (Math.abs(dx) > Math.abs(dy)) handleMove(dx > 0 ? 'right' : 'left')
    else handleMove(dy > 0 ? 'down' : 'up')
  }

  function restart() {
    setBoard(addRandom(addRandom(createBoard())))
    setScore(0); setStatus('playing')
  }

  return (
    <div className="page" style={{ alignItems: 'center' }}
      onTouchStart={onTouchStart} onTouchEnd={onTouchEnd}>
      <div style={{ display: 'flex', justifyContent: 'space-between', width: '100%', marginBottom: 16 }}>
        <button onClick={() => navigate('/games')} style={{ background:'none', border:'none', color:'var(--text2)', cursor:'pointer', fontSize:20 }}>←</button>
        <h2 style={{ fontWeight: 800 }}>🔢 2048</h2>
        <div style={{ display: 'flex', gap: 8 }}>
          <div className="card" style={{ padding: '4px 10px', textAlign: 'center' }}>
            <div style={{ fontSize: 10, color:'var(--text2)' }}>PUAN</div>
            <div style={{ fontFamily:'Space Mono', fontWeight:700, color:'var(--accent2)' }}>{score}</div>
          </div>
          <div className="card" style={{ padding: '4px 10px', textAlign: 'center' }}>
            <div style={{ fontSize: 10, color:'var(--text2)' }}>EN İYİ</div>
            <div style={{ fontFamily:'Space Mono', fontWeight:700, color:'var(--accent2)' }}>{best}</div>
          </div>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 8, background:'var(--bg3)', padding:8, borderRadius:12 }}>
        {board.flat().map((v, i) => (
          <div key={i} style={{
            width: 72, height: 72,
            background: COLORS[v] || '#3c3a33',
            borderRadius: 8,
            display: 'flex', alignItems:'center', justifyContent:'center',
            fontFamily: 'Space Mono',
            fontWeight: 700,
            fontSize: v > 512 ? 18 : v > 64 ? 22 : 26,
            color: v <= 4 ? '#776e65' : '#f9f6f2',
            transition: 'all 0.1s'
          }}>
            {v || ''}
          </div>
        ))}
      </div>

      {status === 'over' && (
        <div className="card" style={{ marginTop: 20, textAlign:'center', width:'100%' }}>
          <p style={{ fontWeight:800, fontSize:22 }}>😔 Oyun Bitti</p>
          <p style={{ color:'var(--accent2)', fontFamily:'Space Mono', marginTop:8 }}>Skor: {score}</p>
          <button className="btn btn-primary" onClick={restart} style={{ marginTop: 16 }}>Tekrar Oyna</button>
        </div>
      )}

      {/* Swipe hint */}
      <p style={{ color:'var(--text2)', fontSize:12, marginTop:16 }}>← ↑ → ↓ veya kaydır</p>

      <button className="btn btn-ghost" onClick={() => navigate('/leaderboard/2048')} style={{ marginTop:8, width:'auto' }}>
        🏆 Skor Tablosu
      </button>
    </div>
  )
}
