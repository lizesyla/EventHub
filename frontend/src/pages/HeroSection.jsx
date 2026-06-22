import { useEffect, useRef, useState } from "react"
import { Link } from "react-router-dom"
import { ArrowRight, CalendarDays, Lock, Zap } from "lucide-react"

export default function HeroSection() {
  const canvasRef = useRef(null)
  const [showContent, setShowContent] = useState(false)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return undefined

    const ctx = canvas.getContext("2d")
    let animId

    canvas.width = window.innerWidth
    canvas.height = window.innerHeight

    const W = canvas.width
    const H = canvas.height

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

    const imgData = octx.getImageData(0, 0, W, H).data
    const targets = []
    const step = 5
    for (let y = 0; y < H; y += step) {
      for (let x = 0; x < W; x += step) {
        if (imgData[(y * W + x) * 4 + 3] > 100) targets.push({ x, y })
      }
    }

    const lines = targets.map(target => {
      const edge = Math.floor(Math.random() * 4)
      let ox
      let oy
      switch (edge) {
        case 0:
          ox = Math.random() * W
          oy = -30
          break
        case 1:
          ox = W + 30
          oy = Math.random() * H
          break
        case 2:
          ox = Math.random() * W
          oy = H + 30
          break
        default:
          ox = -30
          oy = Math.random() * H
          break
      }

      return {
        ox,
        oy,
        tx: target.x,
        ty: target.y,
        delay: Math.random() * 0.4,
        len: 40 + Math.random() * 60,
        hx: ox,
        hy: oy,
        tx2: ox,
        ty2: oy,
      }
    })

    const TRAVEL = 2200
    const HOLD = 1800
    const FADE = 500

    let phase = "travel"
    let phaseT = 0
    let last = null
    const ease = t => t < 0.5 ? 2 * t * t : -1 + (4 - 2 * t) * t

    const tick = timestamp => {
      if (!last) last = timestamp
      const dt = timestamp - last
      last = timestamp
      phaseT += dt

      ctx.clearRect(0, 0, W, H)

      if (phase === "travel") {
        const t = Math.min(phaseT / TRAVEL, 1)

        lines.forEach(line => {
          const lt = Math.max(0, Math.min((t - line.delay) / (1 - line.delay), 1))
          if (lt <= 0) return

          const e = ease(lt)
          line.hx = line.ox + (line.tx - line.ox) * e
          line.hy = line.oy + (line.ty - line.oy) * e

          const dx = line.tx - line.ox
          const dy = line.ty - line.oy
          const dist = Math.sqrt(dx * dx + dy * dy) || 1
          const tailFrac = Math.max(0, e - line.len / dist)
          const te = ease(Math.min(tailFrac, 1))
          line.tx2 = line.ox + dx * te
          line.ty2 = line.oy + dy * te

          ctx.beginPath()
          ctx.moveTo(line.tx2, line.ty2)
          ctx.lineTo(line.hx, line.hy)
          ctx.strokeStyle = `rgba(248,245,240,${0.3 + e * 0.7})`
          ctx.lineWidth = 0.8
          ctx.stroke()
        })

        if (t >= 1) {
          phase = "hold"
          phaseT = 0
        }
      } else if (phase === "hold") {
        lines.forEach(line => {
          ctx.beginPath()
          ctx.arc(line.tx, line.ty, 0.6, 0, Math.PI * 2)
          ctx.fillStyle = "rgba(248,245,240,1)"
          ctx.fill()
        })

        for (let i = 0; i < lines.length; i += 2) {
          for (let j = i + 1; j < lines.length; j += 2) {
            const dx = lines[i].tx - lines[j].tx
            const dy = lines[i].ty - lines[j].ty
            if (dx * dx + dy * dy < 100) {
              ctx.beginPath()
              ctx.moveTo(lines[i].tx, lines[i].ty)
              ctx.lineTo(lines[j].tx, lines[j].ty)
              ctx.strokeStyle = "rgba(248,245,240,0.6)"
              ctx.lineWidth = 0.5
              ctx.stroke()
            }
          }
        }

        if (phaseT >= HOLD) {
          phase = "fadeout"
          phaseT = 0
        }
      } else if (phase === "fadeout") {
        const alpha = 1 - phaseT / FADE
        lines.forEach(line => {
          ctx.beginPath()
          ctx.arc(line.tx, line.ty, 0.6, 0, Math.PI * 2)
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
    <div style={{ minHeight: "100vh", backgroundColor: "#0f172a", position: "relative", overflow: "hidden", display: "flex", alignItems: "center", justifyContent: "center" }}>
      <style>{`
        @keyframes fadeInUp {
          from { opacity: 0; transform: translateY(30px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes shimmer {
          0% { background-position: -200% center; }
          100% { background-position: 200% center; }
        }
        @keyframes pulse { 0%,100%{opacity:.3} 50%{opacity:.7} }
        @keyframes float { 0%,100%{transform:translateY(0)} 50%{transform:translateY(-12px)} }
        .cf { animation: fadeInUp .8s ease forwards; }
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

      <div style={{ position: "absolute", inset: 0, backgroundImage: "linear-gradient(rgba(99,102,241,.04) 1px,transparent 1px),linear-gradient(90deg,rgba(99,102,241,.04) 1px,transparent 1px)", backgroundSize: "60px 60px", pointerEvents: "none" }} />
      <canvas ref={canvasRef} style={{ position: "absolute", inset: 0, zIndex: 1, pointerEvents: "none" }} />

      {showContent && (
        <div style={{ position: "relative", zIndex: 2, textAlign: "center", maxWidth: "800px", padding: "0 24px" }}>
          <div className="cf" style={{ display: "inline-flex", alignItems: "center", gap: "8px", padding: "7px 18px", backgroundColor: "rgba(99,102,241,.12)", border: "1px solid rgba(99,102,241,.25)", borderRadius: "50px", marginBottom: "28px" }}>
            <div className="pulse" style={{ width: "6px", height: "6px", borderRadius: "50%", backgroundColor: "#10b981", boxShadow: "0 0 8px #10b981" }} />
            <span style={{ color: "#a5b4fc", fontSize: "12px", fontWeight: "600", letterSpacing: "1.5px" }}>GENPACT INTERNAL PLATFORM</span>
          </div>

          <h1 className="cf" style={{ fontSize: "72px", fontWeight: "800", margin: "0 0 8px", letterSpacing: 0, lineHeight: 1 }}>
            <span className="shimmer-title">EventHub</span>
          </h1>

          <h2 className="cf2" style={{ fontSize: "24px", fontWeight: "400", color: "#94a3b8", margin: "0 0 24px", letterSpacing: 0 }}>
            Where company events come alive
          </h2>

          <p className="cf3" style={{ fontSize: "17px", color: "#64748b", maxWidth: "520px", margin: "0 auto 44px", lineHeight: 1.75 }}>
            Your company's private events board. Discover lunch-and-learns, game nights, tech talks and socials, then reserve in seconds.
          </p>

          <div className="cf4" style={{ display: "flex", gap: "14px", justifyContent: "center", flexWrap: "wrap", marginBottom: "56px" }}>
            <Link to="/register" className="btn-h" style={{ display: "inline-flex", alignItems: "center", gap: "8px", padding: "15px 34px", backgroundColor: "#6366f1", color: "#fff", borderRadius: "12px", textDecoration: "none", fontSize: "15px", fontWeight: "700", boxShadow: "0 8px 32px rgba(99,102,241,.4)" }}>
              Get Started Free <ArrowRight size={16} />
            </Link>
            <Link to="/events" className="btn-g" style={{ padding: "15px 34px", backgroundColor: "rgba(255,255,255,.04)", color: "#e2e8f0", borderRadius: "12px", textDecoration: "none", fontSize: "15px", fontWeight: "600", border: "1px solid rgba(255,255,255,.1)" }}>
              Browse Events
            </Link>
          </div>

          <div className="cf4" style={{ display: "flex", gap: "40px", justifyContent: "center", flexWrap: "wrap" }}>
            {[
              { Icon: CalendarDays, value: "Live", label: "Event Board" },
              { Icon: Zap, value: "1-click", label: "Reservation" },
              { Icon: Lock, value: "0%", label: "Overbooking" },
            ].map(item => {
              const Icon = item.Icon
              return (
                <div key={item.label} style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                  <Icon size={22} color="#a5b4fc" />
                  <div style={{ textAlign: "left" }}>
                    <p style={{ fontSize: "18px", fontWeight: "800", color: "#a5b4fc", margin: 0, letterSpacing: 0 }}>{item.value}</p>
                    <p style={{ fontSize: "11px", color: "#475569", margin: 0, textTransform: "uppercase", letterSpacing: "1px" }}>{item.label}</p>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      )}

      {showContent && (
        <div className="float" style={{ position: "absolute", bottom: "28px", left: "50%", transform: "translateX(-50%)", display: "flex", flexDirection: "column", alignItems: "center", gap: "8px", opacity: 0.3, zIndex: 2 }}>
          <span style={{ color: "#475569", fontSize: "10px", letterSpacing: "3px", textTransform: "uppercase" }}>Scroll</span>
          <div style={{ width: "1px", height: "36px", background: "linear-gradient(to bottom,#6366f1,transparent)" }} />
        </div>
      )}
    </div>
  )
}
