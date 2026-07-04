import { Link } from "react-router-dom"
import { useEffect, useRef, useState } from "react"
import {
  ArrowLeft,
  ArrowRight,
  BarChart3,
  CalendarDays,
  CheckCircle2,
  ClipboardList,
  Gamepad2,
  Laptop,
  Lock,
  MapPin,
  Mic2,
  PartyPopper,
  Search,
  Target,
  Trophy,
  Utensils,
  Zap,
} from "lucide-react"
import HeroSection from "./HeroSection"

const eventTypeCards = [
  { Icon: Utensils, label: "Lunch & Learn", sub: "Knowledge sharing", bg: "linear-gradient(135deg, #4f46e5, #7c3aed)" },
  { Icon: Gamepad2, label: "Game Night", sub: "Fun and team bonding", bg: "linear-gradient(135deg, #0f172a, #1e3a8a)" },
  { Icon: Laptop, label: "Tech Talk", sub: "Latest in technology", bg: "linear-gradient(135deg, #0c4a6e, #0369a1)" },
  { Icon: PartyPopper, label: "Team Social", sub: "Connect and celebrate", bg: "linear-gradient(135deg, #064e3b, #059669)" },
  { Icon: Mic2, label: "Talks", sub: "Inspiring speakers", bg: "linear-gradient(135deg, #4a044e, #86198f)" },
  { Icon: Trophy, label: "Awards Night", sub: "Celebrate success", bg: "linear-gradient(135deg, #78350f, #d97706)" },
]

function formatDate(value) {
  if (!value) return "No date"
  return new Date(value).toLocaleString("en-US", {
    dateStyle: "medium",
    timeStyle: "short",
  })
}

function VisualIcon({ Icon, size = 56 }) {
  return <Icon size={size} color="#ffffff" strokeWidth={1.6} />
}

export default function Home() {
  const [events, setEvents] = useState([])
  const [loading, setLoading] = useState(true)
  const carouselRef = useRef(null)

  useEffect(() => {
    fetch("https://eventhub-backend-8gd6.onrender.com/api/events")
      .then(res => res.json())
      .then(data => {
        setEvents(Array.isArray(data) ? data : [])
        setLoading(false)
      })
      .catch(() => setLoading(false))
  }, [])

  function scrollLeft() {
    carouselRef.current?.scrollBy({ left: -380, behavior: "smooth" })
  }

  function scrollRight() {
    carouselRef.current?.scrollBy({ left: 380, behavior: "smooth" })
  }

  return (
    <div style={{ backgroundColor: "#ffffff", minHeight: "100vh", fontFamily: "'Inter', sans-serif", overflowX: "hidden" }}>
      <style>{`
        @keyframes float {
          0%, 100% { transform: translateY(0px); }
          50% { transform: translateY(-16px); }
        }
        @keyframes autoScroll {
          0% { transform: translateX(0); }
          100% { transform: translateX(-50%); }
        }
        .btn-primary { transition: all 0.3s ease; }
        .btn-primary:hover {
          transform: translateY(-2px);
          box-shadow: 0 16px 48px rgba(99,102,241,0.5) !important;
        }
        .btn-outline { transition: all 0.3s ease; }
        .btn-outline:hover {
          background: #f1f5f9 !important;
          transform: translateY(-2px);
        }
        .card-hover { transition: transform 0.3s ease, box-shadow 0.3s ease; }
        .card-hover:hover {
          transform: translateY(-8px);
          box-shadow: 0 20px 60px rgba(0,0,0,0.12) !important;
        }
        .grid-img { transition: transform 0.4s ease; overflow: hidden; }
        .grid-img:hover .visual-bg { transform: scale(1.05); }
        .grid-img .visual-bg { transition: transform 0.4s ease; }
        .step-card { transition: all 0.3s ease; cursor: default; }
        .step-card:hover {
          transform: translateY(-6px);
          box-shadow: 0 20px 60px rgba(99,102,241,0.1) !important;
        }
        .carousel-track {
          display: flex;
          gap: 24px;
          overflow-x: auto;
          scroll-snap-type: x mandatory;
          scrollbar-width: none;
          -ms-overflow-style: none;
        }
        .carousel-track::-webkit-scrollbar { display: none; }
        .carousel-item {
          scroll-snap-align: start;
          flex-shrink: 0;
          width: 320px;
        }
        .arrow-btn { transition: all 0.2s ease; }
        .arrow-btn:hover {
          background: #6366f1 !important;
          color: white !important;
        }
        .auto-scroll-track {
          display: flex;
          gap: 20px;
          animation: autoScroll 28s linear infinite;
          width: max-content;
        }
      `}</style>

      <HeroSection />

      <section style={{ padding: "100px 40px", backgroundColor: "#ffffff" }}>
        <div style={{ maxWidth: "1200px", margin: "0 auto", display: "grid", gridTemplateColumns: "1fr 1fr", gap: "80px", alignItems: "center" }}>
          <div>
            <p style={{ color: "#6366f1", fontSize: "12px", fontWeight: "700", letterSpacing: "3px", textTransform: "uppercase", margin: "0 0 16px" }}>ABOUT EVENTHUB</p>
            <h2 style={{ color: "#0f172a", fontSize: "44px", fontWeight: "800", margin: "0 0 24px", letterSpacing: 0, lineHeight: 1.15 }}>
              The perfect events board for your team
            </h2>
            <p style={{ color: "#475569", fontSize: "17px", lineHeight: 1.75, margin: "0 0 32px" }}>
              EventHub turns "we should do something" into a real event people can find and sign up for. One place to post, discover, reserve and track, without scattered emails or chat messages.
            </p>
            <div style={{ display: "flex", flexDirection: "column", gap: "16px", marginBottom: "36px" }}>
              {[
                { Icon: CheckCircle2, text: "Organizers create events with banners, capacity and location" },
                { Icon: Target, text: "Attendees browse and reserve with one click, then cancel anytime" },
                { Icon: BarChart3, text: "Track attendance, guest lists and trends with a live dashboard" },
                { Icon: Lock, text: "Role-based access for attendees, organizers and admins" },
              ].map(item => {
                const Icon = item.Icon
                return (
                  <div key={item.text} style={{ display: "flex", alignItems: "flex-start", gap: "14px" }}>
                    <div style={{ width: "36px", height: "36px", borderRadius: "10px", backgroundColor: "#eef2ff", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                      <Icon size={18} color="#6366f1" />
                    </div>
                    <p style={{ color: "#334155", fontSize: "15px", margin: 0, lineHeight: 1.5, paddingTop: "6px" }}>{item.text}</p>
                  </div>
                )
              })}
            </div>
            <Link to="/register" className="btn-primary" style={{ display: "inline-flex", alignItems: "center", gap: "8px", padding: "14px 28px", backgroundColor: "#6366f1", color: "#fff", borderRadius: "10px", textDecoration: "none", fontSize: "15px", fontWeight: "600", boxShadow: "0 4px 20px rgba(99,102,241,0.3)" }}>
              Join EventHub <ArrowRight size={16} />
            </Link>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px" }}>
            {[
              { value: "1-click", label: "Reservation Process", desc: "Sign up for any event instantly", Icon: Zap, color: "#6366f1" },
              { value: "100%", label: "Overbooking Free", desc: "Atomic capacity enforcement", Icon: Lock, color: "#06b6d4" },
              { value: "Live", label: "Guest Lists", desc: "Real-time reservation updates", Icon: ClipboardList, color: "#10b981" },
              { value: "Open", label: "Events", desc: "Create and manage team events", Icon: CalendarDays, color: "#8b5cf6" },
            ].map(stat => {
              const Icon = stat.Icon
              return (
                <div key={stat.label} className="step-card" style={{ backgroundColor: "#f8fafc", borderRadius: "20px", padding: "28px", border: "1px solid #e2e8f0" }}>
                  <div style={{ width: "44px", height: "44px", borderRadius: "12px", backgroundColor: `${stat.color}18`, display: "flex", alignItems: "center", justifyContent: "center", marginBottom: "16px" }}>
                    <Icon size={22} color={stat.color} />
                  </div>
                  <p style={{ fontSize: "28px", fontWeight: "800", color: stat.color, margin: "0 0 4px", letterSpacing: 0 }}>{stat.value}</p>
                  <p style={{ fontSize: "13px", fontWeight: "700", color: "#1e293b", margin: "0 0 6px" }}>{stat.label}</p>
                  <p style={{ fontSize: "12px", color: "#94a3b8", margin: 0, lineHeight: 1.4 }}>{stat.desc}</p>
                </div>
              )
            })}
          </div>
        </div>
      </section>

      <section style={{ padding: "80px 40px", backgroundColor: "#f8fafc" }}>
        <div style={{ maxWidth: "1200px", margin: "0 auto" }}>
          <div style={{ textAlign: "center", marginBottom: "56px" }}>
            <p style={{ color: "#6366f1", fontSize: "12px", fontWeight: "700", letterSpacing: "3px", textTransform: "uppercase", margin: "0 0 16px" }}>WHAT'S HAPPENING</p>
            <h2 style={{ color: "#0f172a", fontSize: "44px", fontWeight: "800", margin: "0 0 16px", letterSpacing: 0 }}>Events for everyone</h2>
            <p style={{ color: "#64748b", fontSize: "17px", maxWidth: "480px", margin: "0 auto" }}>From lunch-and-learns to game nights, something for every team.</p>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gridTemplateRows: "auto auto", gap: "16px" }}>
            <div className="grid-img" style={{ gridColumn: "1", gridRow: "1 / 3", borderRadius: "24px", overflow: "hidden", position: "relative", minHeight: "480px", boxShadow: "0 4px 24px rgba(0,0,0,0.1)" }}>
              <div className="visual-bg" style={{ width: "100%", height: "100%", background: eventTypeCards[0].bg, display: "flex", alignItems: "center", justifyContent: "center", minHeight: "480px" }}>
                <VisualIcon Icon={eventTypeCards[0].Icon} size={80} />
              </div>
              <div style={{ position: "absolute", inset: 0, background: "linear-gradient(to top, rgba(0,0,0,0.85) 0%, transparent 50%)" }} />
              <div style={{ position: "absolute", bottom: "28px", left: "28px" }}>
                <span style={{ backgroundColor: "#6366f1", color: "#fff", padding: "4px 12px", borderRadius: "20px", fontSize: "11px", fontWeight: "700", letterSpacing: "1px" }}>POPULAR</span>
                <h3 style={{ color: "#fff", fontSize: "26px", fontWeight: "800", margin: "12px 0 6px" }}>Lunch & Learn</h3>
                <p style={{ color: "rgba(255,255,255,0.65)", fontSize: "14px", margin: 0 }}>Knowledge sharing over food</p>
              </div>
            </div>

            {eventTypeCards.slice(1, 5).map((item, index) => {
              const positions = [
                { col: "2", row: "1" },
                { col: "3", row: "1" },
                { col: "2", row: "2" },
                { col: "3", row: "2" },
              ]
              return (
                <div key={item.label} className="grid-img" style={{ gridColumn: positions[index].col, gridRow: positions[index].row, borderRadius: "20px", overflow: "hidden", position: "relative", minHeight: "224px", boxShadow: "0 4px 24px rgba(0,0,0,0.08)" }}>
                  <div className="visual-bg" style={{ width: "100%", height: "100%", background: item.bg, display: "flex", alignItems: "center", justifyContent: "center", minHeight: "224px" }}>
                    <VisualIcon Icon={item.Icon} />
                  </div>
                  <div style={{ position: "absolute", inset: 0, background: "linear-gradient(to top, rgba(0,0,0,0.8) 0%, transparent 60%)" }} />
                  <div style={{ position: "absolute", bottom: "20px", left: "20px" }}>
                    <h3 style={{ color: "#fff", fontSize: "18px", fontWeight: "700", margin: "0 0 4px" }}>{item.label}</h3>
                    <p style={{ color: "rgba(255,255,255,0.6)", fontSize: "12px", margin: 0 }}>{item.sub}</p>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      </section>

      <section style={{ padding: "80px 0", backgroundColor: "#0f172a", overflow: "hidden" }}>
        <div style={{ textAlign: "center", marginBottom: "48px" }}>
          <p style={{ color: "#6366f1", fontSize: "12px", fontWeight: "700", letterSpacing: "3px", textTransform: "uppercase", margin: "0 0 16px" }}>EXPLORE</p>
          <h2 style={{ color: "#ffffff", fontSize: "40px", fontWeight: "800", margin: 0, letterSpacing: 0 }}>All Event Types</h2>
        </div>
        <div style={{ overflow: "hidden" }}>
          <div className="auto-scroll-track">
            {[...eventTypeCards, ...eventTypeCards].map((item, index) => (
              <div key={`${item.label}-${index}`} style={{ width: "300px", height: "200px", borderRadius: "20px", overflow: "hidden", position: "relative", flexShrink: 0 }}>
                <div style={{ width: "100%", height: "100%", background: item.bg, display: "flex", alignItems: "center", justifyContent: "center" }}>
                  <VisualIcon Icon={item.Icon} />
                </div>
                <div style={{ position: "absolute", inset: 0, background: "linear-gradient(to top, rgba(0,0,0,0.75) 0%, transparent 55%)" }} />
                <div style={{ position: "absolute", bottom: "16px", left: "18px" }}>
                  <p style={{ color: "#fff", fontSize: "15px", fontWeight: "700", margin: "0 0 2px" }}>{item.label}</p>
                  <p style={{ color: "rgba(255,255,255,0.6)", fontSize: "12px", margin: 0 }}>{item.sub}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section style={{ padding: "80px 0", backgroundColor: "#ffffff" }}>
        <div style={{ maxWidth: "1200px", margin: "0 auto", padding: "0 40px" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", marginBottom: "40px", flexWrap: "wrap", gap: "16px" }}>
            <div>
              <p style={{ color: "#6366f1", fontSize: "12px", fontWeight: "700", letterSpacing: "3px", textTransform: "uppercase", margin: "0 0 10px" }}>UPCOMING</p>
              <h2 style={{ color: "#0f172a", fontSize: "40px", fontWeight: "800", margin: 0, letterSpacing: 0 }}>Latest Events</h2>
            </div>
            <div style={{ display: "flex", gap: "12px", alignItems: "center" }}>
              <button type="button" className="arrow-btn" onClick={scrollLeft} aria-label="Scroll left" style={{ width: "44px", height: "44px", borderRadius: "50%", backgroundColor: "#f1f5f9", border: "1px solid #e2e8f0", color: "#1e293b", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}><ArrowLeft size={18} /></button>
              <button type="button" className="arrow-btn" onClick={scrollRight} aria-label="Scroll right" style={{ width: "44px", height: "44px", borderRadius: "50%", backgroundColor: "#f1f5f9", border: "1px solid #e2e8f0", color: "#1e293b", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}><ArrowRight size={18} /></button>
              <Link to="/events" style={{ display: "inline-flex", alignItems: "center", gap: "7px", padding: "12px 24px", backgroundColor: "#6366f1", color: "#fff", borderRadius: "10px", textDecoration: "none", fontSize: "14px", fontWeight: "600", marginLeft: "8px" }}>View All <ArrowRight size={15} /></Link>
            </div>
          </div>

          {loading ? (
            <p style={{ color: "#94a3b8" }}>Loading events...</p>
          ) : events.length === 0 ? (
            <div style={{ textAlign: "center", padding: "80px", backgroundColor: "#f8fafc", borderRadius: "24px", border: "1px solid #e2e8f0" }}>
              <CalendarDays size={46} color="#94a3b8" style={{ marginBottom: "16px" }} />
              <h3 style={{ color: "#0f172a", fontSize: "22px", fontWeight: "700", margin: "0 0 12px" }}>No events yet</h3>
              <p style={{ color: "#64748b", margin: "0 0 28px" }}>Events will appear here when organizers create them.</p>
              <Link to="/register" style={{ padding: "13px 28px", backgroundColor: "#6366f1", color: "#fff", borderRadius: "10px", textDecoration: "none", fontSize: "14px", fontWeight: "600" }}>Get Started</Link>
            </div>
          ) : (
            <div ref={carouselRef} className="carousel-track">
              {events.map(event => (
                <div key={event.id} className="carousel-item card-hover" style={{ backgroundColor: "#f8fafc", borderRadius: "20px", overflow: "hidden", border: "1px solid #e2e8f0" }}>
                  {event.banner_url ? (
                    <img src={event.banner_url} alt={`${event.title} banner`} style={{ width: "100%", height: "200px", objectFit: "cover" }} />
                  ) : (
                    <div style={{ width: "100%", height: "200px", background: "linear-gradient(135deg, #4f46e5, #7c3aed)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                      <CalendarDays size={54} color="#fff" />
                    </div>
                  )}
                  <div style={{ padding: "22px" }}>
                    <h3 style={{ color: "#0f172a", fontSize: "17px", fontWeight: "700", margin: "0 0 10px" }}>{event.title}</h3>
                    <p style={{ display: "flex", alignItems: "center", gap: "6px", color: "#64748b", fontSize: "13px", margin: "0 0 4px" }}><MapPin size={14} /> {event.location}</p>
                    <p style={{ display: "flex", alignItems: "center", gap: "6px", color: "#64748b", fontSize: "13px", margin: "0 0 18px" }}><CalendarDays size={14} /> {formatDate(event.date_time)}</p>
                    {event.description && (
                      <p style={{ color: "#64748b", fontSize: "13px", margin: "0 0 18px", lineHeight: 1.6, display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical", overflow: "hidden" }}>{event.description}</p>
                    )}
                    <Link to="/events" style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: "6px", textAlign: "center", padding: "10px", backgroundColor: "#eef2ff", color: "#6366f1", border: "1px solid #c7d2fe", borderRadius: "10px", fontSize: "13px", fontWeight: "600", textDecoration: "none" }}>View Event <ArrowRight size={14} /></Link>
                  </div>
                </div>
              ))}
              <div className="carousel-item card-hover" style={{ backgroundColor: "#f8fafc", borderRadius: "20px", border: "2px dashed #c7d2fe", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", minHeight: "380px", cursor: "pointer" }} onClick={() => { window.location.href = "/events" }}>
                <Target size={42} color="#6366f1" style={{ marginBottom: "16px" }} />
                <p style={{ color: "#6366f1", fontSize: "16px", fontWeight: "700", margin: "0 0 8px" }}>View All Events</p>
                <p style={{ color: "#94a3b8", fontSize: "13px", margin: "0 0 24px", textAlign: "center", padding: "0 20px" }}>See all upcoming company events</p>
                <Link to="/events" style={{ padding: "12px 24px", backgroundColor: "#6366f1", color: "#fff", borderRadius: "10px", textDecoration: "none", fontSize: "14px", fontWeight: "600" }}>Browse All</Link>
              </div>
            </div>
          )}
        </div>
      </section>

      <section style={{ padding: "100px 40px", backgroundColor: "#f8fafc" }}>
        <div style={{ maxWidth: "1100px", margin: "0 auto" }}>
          <div style={{ textAlign: "center", marginBottom: "64px" }}>
            <p style={{ color: "#6366f1", fontSize: "12px", fontWeight: "700", letterSpacing: "3px", textTransform: "uppercase", margin: "0 0 16px" }}>SIMPLE PROCESS</p>
            <h2 style={{ color: "#0f172a", fontSize: "44px", fontWeight: "800", margin: "0 0 16px", letterSpacing: 0 }}>How it works</h2>
            <p style={{ color: "#64748b", fontSize: "17px", maxWidth: "480px", margin: "0 auto" }}>Three simple steps to join your next company event.</p>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "24px" }}>
            {[
              { step: "01", Icon: Search, title: "Discover Events", desc: "Browse upcoming events on a clear board. Find what excites you.", color: "#6366f1" },
              { step: "02", Icon: CheckCircle2, title: "Reserve Instantly", desc: "Sign up with one click. Cancel anytime. First come, first served.", color: "#8b5cf6" },
              { step: "03", Icon: BarChart3, title: "Track Attendance", desc: "Organizers see who is coming. Dashboard shows live turnout and trends.", color: "#06b6d4" },
            ].map(item => {
              const Icon = item.Icon
              return (
                <div key={item.step} className="step-card" style={{ backgroundColor: "#ffffff", padding: "40px 32px", borderRadius: "24px", border: "1px solid #e2e8f0", position: "relative", overflow: "hidden" }}>
                  <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: "3px", background: `linear-gradient(90deg, ${item.color}, transparent)` }} />
                  <div style={{ fontSize: "12px", fontWeight: "800", color: item.color, marginBottom: "24px", letterSpacing: "3px", opacity: 0.6 }}>{item.step}</div>
                  <div style={{ width: "60px", height: "60px", borderRadius: "16px", backgroundColor: `${item.color}15`, display: "flex", alignItems: "center", justifyContent: "center", marginBottom: "24px" }}><Icon size={28} color={item.color} /></div>
                  <h3 style={{ color: "#0f172a", fontSize: "20px", fontWeight: "700", margin: "0 0 14px" }}>{item.title}</h3>
                  <p style={{ color: "#64748b", fontSize: "15px", lineHeight: 1.7, margin: 0 }}>{item.desc}</p>
                </div>
              )
            })}
          </div>

          <div style={{ display: "flex", justifyContent: "center", alignItems: "center", gap: "8px", marginTop: "40px" }}>
            {["Discover", "Reserve", "Track"].map((item, index) => (
              <span key={item} style={{ display: "inline-flex", alignItems: "center", gap: "8px", color: "#6366f1", fontSize: "14px", fontWeight: "700" }}>
                {index > 0 && <ArrowRight size={14} color="#94a3b8" />}
                {item}
              </span>
            ))}
          </div>
        </div>
      </section>

      <section style={{ padding: "100px 40px", textAlign: "center", backgroundColor: "#0f172a", position: "relative", overflow: "hidden" }}>
        <div style={{ position: "relative", zIndex: 1 }}>
          <h2 style={{ color: "#ffffff", fontSize: "52px", fontWeight: "800", margin: "0 0 20px", letterSpacing: 0 }}>Ready to join?</h2>
          <p style={{ color: "#64748b", fontSize: "18px", margin: "0 auto 48px", maxWidth: "420px", lineHeight: 1.6 }}>Create your account and start discovering company events today.</p>
          <div style={{ display: "flex", gap: "16px", justifyContent: "center", flexWrap: "wrap" }}>
            <Link to="/register" className="btn-primary" style={{ display: "inline-flex", alignItems: "center", gap: "8px", padding: "18px 48px", backgroundColor: "#6366f1", color: "#fff", borderRadius: "14px", textDecoration: "none", fontSize: "17px", fontWeight: "700", boxShadow: "0 8px 40px rgba(99,102,241,0.4)" }}>Create Account <ArrowRight size={17} /></Link>
            <Link to="/events" className="btn-outline" style={{ padding: "18px 48px", backgroundColor: "transparent", color: "#e2e8f0", borderRadius: "14px", textDecoration: "none", fontSize: "17px", fontWeight: "600", border: "1px solid rgba(255,255,255,0.1)" }}>Browse Events</Link>
          </div>
        </div>
      </section>

      <footer style={{ borderTop: "1px solid #1e293b", padding: "28px 40px", backgroundColor: "#0f172a", display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "12px" }}>
        <p style={{ color: "#475569", fontSize: "13px", margin: 0 }}>
          <span style={{ color: "#6366f1", fontWeight: "700" }}>EventHub</span> - Internal Events Platform - Genpact 2026
        </p>
        <div style={{ display: "flex", gap: "24px" }}>
          <Link to="/events" style={{ color: "#475569", textDecoration: "none", fontSize: "13px" }}>Events</Link>
          <Link to="/login" style={{ color: "#475569", textDecoration: "none", fontSize: "13px" }}>Sign In</Link>
          <Link to="/register" style={{ color: "#475569", textDecoration: "none", fontSize: "13px" }}>Register</Link>
        </div>
      </footer>
    </div>
  )
}
