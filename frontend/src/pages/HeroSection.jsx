import { useEffect, useRef, useState } from "react"
import { Link } from "react-router-dom"

export default function HeroSection() {
  const canvasRef = useRef(null)
  const [showContent, setShowContent] = useState(false)

  useEffect(() => {
    const canvas = canvasRef.current
    const ctx = canvas.getContext("2d")
    let animationId
    let startTime = null

    const resize = () => {
      canvas.width = window.innerWidth
      canvas.height = window.innerHeight
    }
    resize()
    window.addEventListener("resize", resize)

    // Particles that form "EventHub"
    const TOTAL_DURATION = 2500  // ms to converge
    const HOLD_DURATION = 800    // ms to hold
    const FADE_DURATION = 600    // ms to fade out

    // Create off-screen canvas to measure text pixels
    const offscreen = document.createElement("canvas")
    offscreen.width = canvas.width
    offscreen.height = canvas.height
    const offCtx = offscreen.getContext("2d")

    const fontSize = Math.min(canvas.width * 0.12, 120)
    offCtx.font = `800 ${fontSize}px Inter, sans-serif`
    offCtx.fillStyle = "white"
    offCtx.textAlign = "center"
    offCtx.textBaseline = "middle"
    offCtx.fillText("EventHub", canvas.width / 2, canvas.height / 2)

    // Sample pixels from text
    const imageData = offCtx.getImageData(0, 0, offscreen.width, offscreen.height)
    const pixels = []
    const step = 6
    for (let y = 0; y < offscreen.height; y += step) {
      for (let x = 0; x < offscreen.width; x += step) {
        const idx = (y * offscreen.width + x) * 4
        if (imageData.data[idx + 3] > 128) {
          pixels.push({ x, y })
        }
      }
    }

    // Create particles
    const particles = pixels.map(p => ({
      targetX: p.x,
      targetY: p.y,
      x: Math.random() * canvas.width,
      y: Math.random() * canvas.height,
      originX: 0,
      originY: 0,
      size: Math.random() * 1.5 + 0.5,
    }))

    // Set random origins from edges
    particles.forEach(p => {
      const edge = Math.floor(Math.random() * 4)
      switch (edge) {
        case 0: p.originX = Math.random() * canvas.width; p.originY = -20; break
        case 1: p.originX = canvas.width + 20; p.originY = Math.random() * canvas.height; break
        case 2: p.originX = Math.random() * canvas.width; p.originY = canvas.height + 20; break
        case 3: p.originX = -20; p.originY = Math.random() * canvas.height; break
      }
      p.x = p.originX
      p.y = p.originY
    })

    let phase = "converge" // converge → hold → fadeout
    let phaseStart = null

    const easeInOut = t => t < 0.5 ? 2 * t * t : -1 + (4 - 2 * t) * t

    const draw = (timestamp) => {
      if (!startTime) startTime = timestamp
      if (!phaseStart) phaseStart = timestamp

      ctx.clearRect(0, 0, canvas.width, canvas.height)

      const elapsed = timestamp - phaseStart

      if (phase === "converge") {
        const t = Math.min(elapsed / TOTAL_DURATION, 1)
        const ease = easeInOut(t)

        particles.forEach(p => {
          p.x = p.originX + (p.targetX - p.originX) * ease
          p.y = p.originY + (p.targetY - p.originY) * ease

          ctx.beginPath()
          ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2)
          ctx.fillStyle = `rgba(248, 245, 240, ${0.4 + ease * 0.6})`
          ctx.fill()
        })

        if (t >= 1) {
          phase = "hold"
          phaseStart = timestamp
        }

      } else if (phase === "hold") {
        particles.forEach(p => {
          ctx.beginPath()
          ctx.arc(p.targetX, p.targetY, p.size, 0, Math.PI * 2)
          ctx.fillStyle = "rgba(248, 245, 240, 1)"
          ctx.fill()
        })

        // Draw connecting lines between nearby particles
        for (let i = 0; i < particles.length; i += 3) {
          for (let j = i + 1; j < particles.length; j += 3) {
            const dx = particles[i].targetX - particles[j].targetX
            const dy = particles[i].targetY - particles[j].targetY
            const dist = Math.sqrt(dx * dx + dy * dy)
            if (dist < 12) {
              ctx.beginPath()
              ctx.moveTo(particles[i].targetX, particles[i].targetY)
              ctx.lineTo(particles[j].targetX, particles[j].targetY)
              ctx.strokeStyle = `rgba(248, 245, 240, ${0.3 * (1 - dist / 12)})`
              ctx.lineWidth = 0.5
              ctx.stroke()
            }
          }
        }

        if (elapsed >= HOLD_DURATION) {
          phase = "fadeout"
          phaseStart = timestamp
        }

      } else if (phase === "fadeout") {
        const t = Math.min(elapsed / FADE_DURATION, 1)
        const alpha = 1 - easeInOut(t)

        particles.forEach(p => {
          ctx.beginPath()
          ctx.arc(p.targetX, p.targetY, p.size, 0, Math.PI * 2)
          ctx.fillStyle = `rgba(248, 245, 240, ${alpha})`
          ctx.fill()
        })

        if (t >= 1) {
          cancelAnimationFrame(animationId)
          setShowContent(true)
          return
        }
      }

      animationId = requestAnimationFrame(draw)
    }

    animationId = requestAnimationFrame(draw)

    return () => {
      cancelAnimationFrame(animationId)
      window.removeEventListener("resize", resize)
    }
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
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes float {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-12px); }
        }
        @keyframes pulse {
          0%, 100% { opacity: 0.3; }
          50% { opacity: 0.7; }
        }
        @keyframes shimmer {
          0% { background-position: -200% center; }
          100% { background-position: 200% center; }
        }
        .content-fade { animation: fadeInUp 0.8s ease forwards; }
        .content-fade-2 { animation: fadeInUp 0.8s ease 0.15s forwards; opacity: 0; }
        .content-fade-3 { animation: fadeInUp 0.8s ease 0.3s forwards; opacity: 0; }
        .content-fade-4 { animation: fadeInUp 0.8s ease 0.45s forwards; opacity: 0; }
        .float-slow { animation: float 6s ease-in-out infinite; }
        .pulse-orb { animation: pulse 4s ease-in-out infinite; }
        .shimmer-title {
          background: linear-gradient(90deg, #f8f5f0, #a5b4fc, #818cf8, #a5b4fc, #f8f5f0);
          background-size: 200% auto;
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          animation: shimmer 4s linear infinite;
        }
        .btn-hero {
          transition: all 0.3s ease;
        }
        .btn-hero:hover {
          transform: translateY(-2px);
          box-shadow: 0 12px 40px rgba(99,102,241,0.5) !important;
        }
        .btn-ghost {
          transition: all 0.3s ease;
        }
        .btn-ghost:hover {
          background: rgba(255,255,255,0.08) !important;
          transform: translateY(-2px);
        }
      `}</style>

      {/* Grid background */}
      <div style={{ position: 'absolute', inset: 0, backgroundImage: 'linear-gradient(rgba(99,102,241,0.04) 1px, transparent 1px), linear-gradient(90deg, rgba(99,102,241,0.04) 1px, transparent 1px)', backgroundSize: '60px 60px', pointerEvents: 'none' }} />

      {/* Ambient orbs */}
      <div className="pulse-orb float-slow" style={{ position: 'absolute', top: '-10%', left: '-8%', width: '600px', height: '600px', borderRadius: '50%', background: 'radial-gradient(circle, rgba(99,102,241,0.12) 0%, transparent 70%)', pointerEvents: 'none' }} />
      <div className="pulse-orb" style={{ position: 'absolute', bottom: '-10%', right: '-8%', width: '700px', height: '700px', borderRadius: '50%', background: 'radial-gradient(circle, rgba(139,92,246,0.08) 0%, transparent 70%)', pointerEvents: 'none', animationDelay: '2s' }} />

      {/* Canvas for particle animation */}
      <canvas ref={canvasRef} style={{ position: 'absolute', inset: 0, zIndex: 1, pointerEvents: 'none' }} />

      {/* Content — shown after animation */}
      {showContent && (
        <div style={{ position: 'relative', zIndex: 2, textAlign: 'center', maxWidth: '800px', padding: '0 24px' }}>

          {/* Badge */}
          <div className="content-fade" style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', padding: '7px 18px', backgroundColor: 'rgba(99,102,241,0.12)', border: '1px solid rgba(99,102,241,0.25)', borderRadius: '50px', marginBottom: '28px' }}>
            <div style={{ width: '6px', height: '6px', borderRadius: '50%', backgroundColor: '#10b981', boxShadow: '0 0 8px #10b981' }} />
            <span style={{ color: '#a5b4fc', fontSize: '12px', fontWeight: '600', letterSpacing: '1.5px' }}>GENPACT INTERNAL PLATFORM</span>
          </div>

          {/* Title */}
          <h1 className="content-fade" style={{ fontSize: 'clamp(48px, 8vw, 88px)', fontWeight: '800', margin: '0 0 8px', letterSpacing: '-3px', lineHeight: '1.0' }}>
            <span className="shimmer-title">EventHub</span>
          </h1>

          <h2 className="content-fade-2" style={{ fontSize: 'clamp(20px, 3vw, 28px)', fontWeight: '400', color: '#94a3b8', margin: '0 0 28px', letterSpacing: '-0.5px' }}>
            Where company events come alive
          </h2>

          <p className="content-fade-3" style={{ fontSize: '17px', color: '#64748b', maxWidth: '520px', margin: '0 auto 44px', lineHeight: '1.75' }}>
            Your company's private events board. Discover lunch-and-learns, game nights, tech talks and socials — then reserve in seconds.
          </p>

          {/* Buttons */}
          <div className="content-fade-4" style={{ display: 'flex', gap: '14px', justifyContent: 'center', flexWrap: 'wrap', marginBottom: '56px' }}>
            <Link to="/register" className="btn-hero" style={{
              padding: '15px 34px', backgroundColor: '#6366f1', color: '#fff',
              borderRadius: '12px', textDecoration: 'none', fontSize: '15px', fontWeight: '700',
              boxShadow: '0 8px 32px rgba(99,102,241,0.4)', letterSpacing: '0.3px'
            }}>
              Get Started Free →
            </Link>
            <Link to="/events" className="btn-ghost" style={{
              padding: '15px 34px', backgroundColor: 'rgba(255,255,255,0.04)', color: '#e2e8f0',
              borderRadius: '12px', textDecoration: 'none', fontSize: '15px', fontWeight: '600',
              border: '1px solid rgba(255,255,255,0.1)'
            }}>
              Browse Events
            </Link>
          </div>

          {/* Stats */}
          <div className="content-fade-4" style={{ display: 'flex', gap: '40px', justifyContent: 'center', flexWrap: 'wrap' }}>
            {[
              { icon: '📅', value: 'Live', label: 'Event Board' },
              { icon: '⚡', value: '1-click', label: 'Reservation' },
              { icon: '🔒', value: '0%', label: 'Overbooking' },
            ].map((s, i) => (
              <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <span style={{ fontSize: '20px' }}>{s.icon}</span>
                <div style={{ textAlign: 'left' }}>
                  <p style={{ fontSize: '18px', fontWeight: '800', color: '#a5b4fc', margin: 0, letterSpacing: '-0.5px' }}>{s.value}</p>
                  <p style={{ fontSize: '11px', color: '#475569', margin: 0, textTransform: 'uppercase', letterSpacing: '1px' }}>{s.label}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Scroll hint */}
      {showContent && (
        <div className="float-slow" style={{ position: 'absolute', bottom: '28px', left: '50%', transform: 'translateX(-50%)', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px', opacity: 0.3, zIndex: 2 }}>
          <span style={{ color: '#475569', fontSize: '10px', letterSpacing: '3px', textTransform: 'uppercase' }}>Scroll</span>
          <div style={{ width: '1px', height: '36px', background: 'linear-gradient(to bottom, #6366f1, transparent)' }} />
        </div>
      )}
    </div>
  )
}
