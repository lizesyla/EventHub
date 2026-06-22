import { useEffect, useRef, useState } from "react"
import { Link } from "react-router-dom"

export default function HeroSection() {
  const canvasRef = useRef(null)
  const [showContent, setShowContent] = useState(false)

  useEffect(() => {
    const canvas = canvasRef.current
    const ctx = canvas.getContext("2d")
    let animId

    canvas.width = window.innerWidth
    canvas.height = window.innerHeight

    const W = canvas.width
    const H = canvas.height

    // ── 1. Render text to offscreen canvas and sample edge pixels ──
    const off = document.createElement("canvas")
    off.width = W
    off.height = H
    const octx = off.getContext("2d")
    const fontSize = Math.min(W * 0.13, 130)
    octx.font = `900 ${fontSize}px Inter, Arial, sans-serif`
    octx.fillStyle = "#fff"
    octx.textAlign = "center"
    octx.textBaseline = "middle"
    octx.fillText("EventHub", W / 2, H / 2)

    // Sample target points from text
    const imgData = octx.getImageData(0, 0, W, H).data
    const targets = []
    const step = 5
    for (let y = 0; y < H; y += step) {
      for (let x = 0; x < W; x += step) {
        if (imgData[(y * W + x) * 4 + 3] > 100) {
          targets.push({ x, y })
        }
      }
    }

    // ── 2. Create lines (fijet) ──
    // Each "fije" is a line segment that travels from edge to its target
    const lines = targets.map(t => {
      // random edge origin
      const edge = Math.floor(Math.random() * 4)
      let ox, oy
      switch (edge) {
        case 0: ox = Math.random() * W; oy = -30; break        // top
        case 1: ox = W + 30; oy = Math.random() * H; break     // right
        case 2: ox = Math.random() * W; oy = H + 30; break     // bottom
        default: ox = -30; oy = Math.random() * H; break       // left
      }

      // tail point starts at origin too
      const delay = Math.random() * 0.4  // 0..0.4 stagger
      const len = 40 + Math.random() * 60 // tail length in px

      return {
        ox, oy,
        tx: t.x, ty: t.y,
        delay,
        len,
        // derived each frame
        hx: ox, hy: oy,   // head
        tx2: ox, ty2: oy, // tail (lags behind)
        done: false,
      }
    })

    // ── 3. Animation phases ──
    const TRAVEL  = 2200  // ms — lines fly in
    const HOLD    = 1800  // ms — sit as text
    const FADE    = 500   // ms — fade out

    let phase = "travel"
    let phaseT = 0
    let last = null

    const ease = t => t < .5 ? 2*t*t : -1+(4-2*t)*t

    const tick = ts => {
      if (!last) last = ts
      const dt = ts - last
      last = ts
      phaseT += dt

      ctx.clearRect(0, 0, W, H)

      if (phase === "travel") {
        const t = Math.min(phaseT / TRAVEL, 1)

        lines.forEach(ln => {
          // each line has its own delayed progress
          const lt = Math.max(0, Math.min((t - ln.delay) / (1 - ln.delay), 1))
          if (lt <= 0) return

          const e = ease(lt)
          // head position
          ln.hx = ln.ox + (ln.tx - ln.ox) * e
          ln.hy = ln.oy + (ln.ty - ln.oy) * e

          // tail lags by 'len' pixels along same vector
          const dx = ln.tx - ln.ox
          const dy = ln.ty - ln.oy
          const dist = Math.sqrt(dx*dx + dy*dy) || 1
          const tailFrac = Math.max(0, e - ln.len / dist)
          const te = ease(Math.min(tailFrac, 1))
          ln.tx2 = ln.ox + dx * te
          ln.ty2 = ln.oy + dy * te

          // draw line
          const alpha = 0.3 + e * 0.7
          ctx.beginPath()
          ctx.moveTo(ln.tx2, ln.ty2)
          ctx.lineTo(ln.hx, ln.hy)
          ctx.strokeStyle = `rgba(248,245,240,${alpha})`
          ctx.lineWidth = 0.8
          ctx.stroke()
        })

        if (t >= 1) { phase = "hold"; phaseT = 0 }

      } else if (phase === "hold") {
        // draw all lines at their targets — looks like solid text
        lines.forEach(ln => {
          ctx.beginPath()
          ctx.moveTo(ln.tx, ln.ty)
          ctx.lineTo(ln.tx, ln.ty)   // dot at target
          ctx.arc(ln.tx, ln.ty, 0.6, 0, Math.PI * 2)
          ctx.fillStyle = "rgba(248,245,240,1)"
          ctx.fill()
        })

        // also draw connecting segments between nearby points for density
        for (let i = 0; i < lines.length; i += 2) {
          for (let j = i+1; j < lines.length; j += 2) {
            const dx = lines[i].tx - lines[j].tx
            const dy = lines[i].ty - lines[j].ty
            if (dx*dx + dy*dy < 100) {
              ctx.beginPath()
              ctx.moveTo(lines[i].tx, lines[i].ty)
              ctx.lineTo(lines[j].tx, lines[j].ty)
              ctx.strokeStyle = "rgba(248,245,240,0.6)"
              ctx.lineWidth = 0.5
              ctx.stroke()
            }
          }
        }

        if (phaseT >= HOLD) { phase = "fadeout"; phaseT = 0 }

      } else if (phase === "fadeout") {
        const alpha = 1 - phaseT / FADE
        lines.forEach(ln => {
          ctx.beginPath()
          ctx.arc(ln.tx, ln.ty, 0.6, 0, Math.PI * 2)
          ctx.fillStyle = `rgba(248,245,240,${alpha})`
          ctx.fill()
        })

        if (phaseT >= FADE) {
          cancelAnimationFrame(animId)
          setShowContent(true)
          return
        }
      }

      animId = requestAnimationFrame(tick)
    }

    animId = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(animId)
  }, [])

  return (
    <div style={{
      minHeight: '100vh',
      backgroundColor: '#0f172a',
      position: 'relative',
      overflow: 'hidden',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
    }}>
      <style>{`
        @keyframes fadeInUp {
          from { opacity: 0; transform: translateY(30px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        @keyframes shimmer {
          0%   { background-position: -200% center; }
          100% { background-position:  200% center; }
        }
        @keyframes pulse { 0%,100%{opacity:.3} 50%{opacity:.7} }
        @keyframes float { 0%,100%{transform:translateY(0)} 50%{transform:translateY(-12px)} }
        .cf  { animation: fadeInUp .8s ease forwards; }
        .cf2 { animation: fadeInUp .8s ease .15s forwards; opacity:0; }
        .cf3 { animation: fadeInUp .8s ease .30s forwards; opacity:0; }
        .cf4 { animation: fadeInUp .8s ease .45s forwards; opacity:0; }
        .shimmer-title {
          background: linear-gradient(90deg,#f8f5f0,#a5b4fc,#818cf8,#a5b4fc,#f8f5f0);
          background-size: 200% auto;
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          animation: shimmer 4s linear infinite;
        }
        .btn-h { transition: all .3s ease; }
        .btn-h:hover { transform:translateY(-2px); box-shadow:0 12px 40px rgba(99,102,241,.5)!important; }
        .btn-g { transition: all .3s ease; }
        .btn-g:hover { background:rgba(255,255,255,.08)!important; transform:translateY(-2px); }
        .float { animation: float 6s ease-in-out infinite; }
        .pulse { animation: pulse 4s ease-in-out infinite; }
      `}</style>

      {/* Grid */}
      <div style={{ position:'absolute', inset:0, backgroundImage:'linear-gradient(rgba(99,102,241,.04) 1px,transparent 1px),linear-gradient(90deg,rgba(99,102,241,.04) 1px,transparent 1px)', backgroundSize:'60px 60px', pointerEvents:'none' }} />

      {/* Ambient orbs */}
      <div className="pulse" style={{ position:'absolute', top:'-10%', left:'-8%', width:'600px', height:'600px', borderRadius:'50%', background:'radial-gradient(circle,rgba(99,102,241,.12) 0%,transparent 70%)', pointerEvents:'none' }} />
      <div className="pulse" style={{ position:'absolute', bottom:'-10%', right:'-8%', width:'700px', height:'700px', borderRadius:'50%', background:'radial-gradient(circle,rgba(139,92,246,.08) 0%,transparent 70%)', pointerEvents:'none', animationDelay:'2s' }} />

      {/* Canvas */}
      <canvas ref={canvasRef} style={{ position:'absolute', inset:0, zIndex:1, pointerEvents:'none' }} />

      {/* Content after animation */}
      {showContent && (
        <div style={{ position:'relative', zIndex:2, textAlign:'center', maxWidth:'800px', padding:'0 24px' }}>

          {/* Badge */}
          <div className="cf" style={{ display:'inline-flex', alignItems:'center', gap:'8px', padding:'7px 18px', backgroundColor:'rgba(99,102,241,.12)', border:'1px solid rgba(99,102,241,.25)', borderRadius:'50px', marginBottom:'28px' }}>
            <div className="pulse" style={{ width:'6px', height:'6px', borderRadius:'50%', backgroundColor:'#10b981', boxShadow:'0 0 8px #10b981' }} />
            <span style={{ color:'#a5b4fc', fontSize:'12px', fontWeight:'600', letterSpacing:'1.5px' }}>GENPACT INTERNAL PLATFORM</span>
          </div>

          {/* Title */}
          <h1 className="cf" style={{ fontSize:'clamp(48px,8vw,88px)', fontWeight:'800', margin:'0 0 8px', letterSpacing:'-3px', lineHeight:'1.0' }}>
            <span className="shimmer-title">EventHub</span>
          </h1>

          <h2 className="cf2" style={{ fontSize:'clamp(18px,2.5vw,26px)', fontWeight:'400', color:'#94a3b8', margin:'0 0 24px', letterSpacing:'-0.5px' }}>
            Where company events come alive
          </h2>

          <p className="cf3" style={{ fontSize:'17px', color:'#64748b', maxWidth:'520px', margin:'0 auto 44px', lineHeight:'1.75' }}>
            Your company's private events board. Discover lunch-and-learns, game nights, tech talks and socials — then RSVP in seconds.
          </p>

          {/* Buttons */}
          <div className="cf4" style={{ display:'flex', gap:'14px', justifyContent:'center', flexWrap:'wrap', marginBottom:'56px' }}>
            <Link to="/register" className="btn-h" style={{ padding:'15px 34px', backgroundColor:'#6366f1', color:'#fff', borderRadius:'12px', textDecoration:'none', fontSize:'15px', fontWeight:'700', boxShadow:'0 8px 32px rgba(99,102,241,.4)' }}>
              Get Started Free →
            </Link>
            <Link to="/events" className="btn-g" style={{ padding:'15px 34px', backgroundColor:'rgba(255,255,255,.04)', color:'#e2e8f0', borderRadius:'12px', textDecoration:'none', fontSize:'15px', fontWeight:'600', border:'1px solid rgba(255,255,255,.1)' }}>
              Browse Events
            </Link>
          </div>

          {/* Stats */}
          <div className="cf4" style={{ display:'flex', gap:'40px', justifyContent:'center', flexWrap:'wrap' }}>
            {[
              { icon:'📅', value:'Live',    label:'Event Board' },
              { icon:'⚡', value:'1-click', label:'RSVP'        },
              { icon:'🔒', value:'0%',      label:'Overbooking' },
            ].map((s,i) => (
              <div key={i} style={{ display:'flex', alignItems:'center', gap:'10px' }}>
                <span style={{ fontSize:'20px' }}>{s.icon}</span>
                <div style={{ textAlign:'left' }}>
                  <p style={{ fontSize:'18px', fontWeight:'800', color:'#a5b4fc', margin:0, letterSpacing:'-0.5px' }}>{s.value}</p>
                  <p style={{ fontSize:'11px', color:'#475569', margin:0, textTransform:'uppercase', letterSpacing:'1px' }}>{s.label}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Scroll hint */}
      {showContent && (
        <div className="float" style={{ position:'absolute', bottom:'28px', left:'50%', transform:'translateX(-50%)', display:'flex', flexDirection:'column', alignItems:'center', gap:'8px', opacity:.3, zIndex:2 }}>
          <span style={{ color:'#475569', fontSize:'10px', letterSpacing:'3px', textTransform:'uppercase' }}>Scroll</span>
          <div style={{ width:'1px', height:'36px', background:'linear-gradient(to bottom,#6366f1,transparent)' }} />
        </div>
      )}
    </div>
  )
}
