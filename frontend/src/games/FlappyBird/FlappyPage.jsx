import { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { api } from '../../lib/api.js'
import { useStore } from '../../lib/store.js'
import { useGameScrollLock } from '../../lib/hooks/useGameScrollLock.js'

const W = 320, H = 480, GRAVITY = 0.5, JUMP = -9, PIPE_W = 50, GAP = 140, SPEED = 2.5

export default function FlappyPage() {
  const navigate = useNavigate()
  const session = useStore(s => s.session)
  const canvasRef = useRef(null)
  const state = useRef({
    bird: { y: H/2, vy: 0 },
    pipes: [],
    score: 0,
    status: 'idle', // idle | playing | dead
    frame: 0
  })
  const [displayScore, setDisplayScore] = useState(0)
  const [status, setStatus] = useState('idle')
  const [forceRender, setForceRender] = useState(0)
  const rafRef = useRef(null)
  const jumpBlockRef = useRef(false)

  // Scroll kilidi - oyun içinde her zaman aktif
  useGameScrollLock(true)

  useEffect(() => {
    const canvas = canvasRef.current
    const ctx = canvas.getContext('2d')

    function spawnPipe() {
      const top = 80 + Math.random() * (H - GAP - 160)
      state.current.pipes.push({ x: W, top })
    }

    function loop() {
      const s = state.current
      ctx.clearRect(0, 0, W, H)

      // Background
      ctx.fillStyle = '#0f0f1a'
      ctx.fillRect(0, 0, W, H)

      if (s.status === 'playing') {
        s.frame++
        s.bird.vy += GRAVITY
        s.bird.y += s.bird.vy

        // Spawn pipe
        if (s.frame % 90 === 0) spawnPipe()

        // Move pipes
        s.pipes = s.pipes.filter(p => p.x + PIPE_W > 0)
        s.pipes.forEach(p => {
          p.x -= SPEED
          // Score
          if (Math.floor(p.x) === 60) {
            s.score++
            setDisplayScore(s.score)
          }
        })

        // Collision
        const bx = 60, by = s.bird.y, br = 14
        if (by - br < 0 || by + br > H) { die(s); return }

        for (const p of s.pipes) {
          if (bx + br > p.x && bx - br < p.x + PIPE_W) {
            if (by - br < p.top || by + br > p.top + GAP) {
              die(s); return
            }
          }
        }
      }

      // Draw pipes
      ctx.fillStyle = '#27ae60'
      s.pipes.forEach(p => {
        ctx.fillRect(p.x, 0, PIPE_W, p.top)
        ctx.fillRect(p.x, p.top + GAP, PIPE_W, H)
      })

      // Draw bird
      ctx.save()
      ctx.translate(60, s.bird.y)
      ctx.rotate(Math.min(Math.max(s.bird.vy * 0.05, -0.5), 1))
      ctx.fillStyle = '#f5a623'
      ctx.beginPath()
      ctx.arc(0, 0, 14, 0, Math.PI*2)
      ctx.fill()
      ctx.fillStyle = '#e94560'
      ctx.beginPath()
      ctx.arc(6, -3, 5, 0, Math.PI*2)
      ctx.fill()
      ctx.restore()

      // Overlay
      if (s.status === 'idle') {
        ctx.fillStyle = 'rgba(0,0,0,0.5)'
        ctx.fillRect(0, 0, W, H)
        ctx.fillStyle = '#f0f0f0'
        ctx.font = 'bold 28px Syne, sans-serif'
        ctx.textAlign = 'center'
        ctx.fillText('Flappy Bird', W/2, H/2 - 20)
        ctx.font = '16px Syne, sans-serif'
        ctx.fillStyle = 'rgba(240,240,240,0.7)'
        ctx.fillText('Tıkla veya dokun', W/2, H/2 + 20)
      }

      if (s.status === 'dead') {
        ctx.fillStyle = 'rgba(0,0,0,0.65)'
        ctx.fillRect(0, 0, W, H)
        ctx.fillStyle = '#f0f0f0'
        ctx.font = 'bold 24px Syne, sans-serif'
        ctx.textAlign = 'center'
        ctx.fillText('Oyun Bitti', W/2, H/2 - 50)
        ctx.fillStyle = '#f5a623'
        ctx.font = 'bold 20px Space Mono, monospace'
        ctx.fillText(`Skor: ${s.score}`, W/2, H/2 - 10)
      }

      rafRef.current = requestAnimationFrame(loop)
    }

    function die(s) {
      s.status = 'dead'
      setStatus('dead')
      if (session) api.saveScore(session.sessionId, 'flappy', s.score)
    }

    rafRef.current = requestAnimationFrame(loop)
    return () => cancelAnimationFrame(rafRef.current)
  }, [session])

  return (
    <div className="page" style={{ alignItems: 'center' }}>
      <div style={{ display:'flex', justifyContent:'space-between', width:'100%', marginBottom:12 }}>
        <button onClick={() => navigate('/games')} style={{ background:'none', border:'none', color:'var(--text2)', cursor:'pointer', fontSize:20 }}>←</button>
        <h2 style={{ fontWeight:800 }}>🐦 Flappy Bird</h2>
        <span style={{ fontFamily:'Space Mono', color:'var(--accent2)', fontWeight:700 }}>{displayScore}</span>
      </div>

      <div style={{ position:'relative' }}>
        <canvas
          ref={canvasRef}
          width={W} height={H}
          onPointerDown={e => {
            e.preventDefault()
            e.stopPropagation()

            // Çift tıklama koruması
            if (jumpBlockRef.current) return

            const s = state.current
            if (s.status === 'idle') {
              s.bird = { y: H/2, vy: 0 }
              s.pipes = []
              s.score = 0
              s.frame = 0
              s.status = 'playing'
              setDisplayScore(0)
              setStatus('playing')
            } else if (s.status === 'playing') {
              s.bird.vy = JUMP
              // 200ms block - çift tıklama koruması
              jumpBlockRef.current = true
              setTimeout(() => { jumpBlockRef.current = false }, 200)
            }
          }}
          style={{ borderRadius:12, border:'1px solid var(--border)', cursor:'pointer', maxWidth:'100%', touchAction:'none', userSelect:'none', display:'block' }}
        />
      </div>

      <button className="btn btn-ghost" onClick={() => navigate('/leaderboard/flappy')} style={{ marginTop:12, width:'auto' }}>
        🏆 Skor Tablosu
      </button>

      {status === 'dead' && (
        <button className="btn btn-primary" onClick={() => {
          const s = state.current
          s.bird = { y: H/2, vy: 0 }
          s.pipes = []
          s.score = 0
          s.frame = 0
          s.status = 'playing'
          setDisplayScore(0)
          setStatus('playing')
          setForceRender(prev => prev + 1) // Force render
        }} style={{ marginTop:12, width:'auto', padding:'12px 32px' }}>
          🔄 Tekrar Oyna
        </button>
      )}
    </div>
  )
}
