import { Link } from "react-router-dom"
import { useState, useEffect } from "react"

const colors = {
  bgDark: '#0f0c1b',
  cardBg: '#1a162e',
  inputBg: '#252142',
  textMain: '#ffffff',
  textMuted: '#b3b0cd',
  accent: '#8b5cf6',
  border: '#2d294e',
  success: '#10b981',
  danger: '#ef4444',
}

export default function Events() {
  const [upcoming, setUpcoming] = useState([])
  const [history, setHistory] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  // Task 4.8 — Filter state
  const [search, setSearch] = useState("")
  const [location, setLocation] = useState("")

  const fetchEvents = async (s = search, l = location) => {
    setLoading(true)
    setError(null)
    try {
      const params = new URLSearchParams()
      if (s) params.append("search", s)
      if (l) params.append("location", l)

      const res = await fetch(`http://localhost:8000/api/events?${params.toString()}`)
      if (!res.ok) throw new Error("Gabim gjatë ngarkimit të event-eve.")
      const data = await res.json()
      setUpcoming(data.upcoming || [])
      setHistory(data.history || [])
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { fetchEvents() }, [])

  const handleFilter = (e) => {
    e.preventDefault()
    fetchEvents()
  }

  const handleReset = () => {
    setSearch("")
    setLocation("")
    fetchEvents("", "")
  }

  return (
    <div style={{ backgroundColor: colors.bgDark, minHeight: '100vh', padding: '40px 20px', fontFamily: "'Inter', sans-serif" }}>
      <div style={{ maxWidth: '1100px', margin: '0 auto' }}>

        {/* Header */}
        <div style={{ marginBottom: '36px' }}>
          <h1 style={{ color: colors.textMain, fontSize: '36px', fontWeight: '800', margin: '0 0 8px' }}>
            🗓 Events
          </h1>
          <p style={{ color: colors.textMuted, fontSize: '15px', margin: 0 }}>
            Zbulo event-et e ardhshme dhe regjistrohu me RSVP.
          </p>
        </div>

        {/* Task 4.8 — Filter Bar */}
        <form onSubmit={handleFilter} style={{
          display: 'flex', gap: '12px', flexWrap: 'wrap',
          backgroundColor: colors.cardBg, padding: '20px',
          borderRadius: '12px', border: `1px solid ${colors.border}`,
          marginBottom: '40px'
        }}>
          <input
            type="text"
            placeholder="🔍 Kërko event..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            style={inputStyle}
          />
          <input
            type="text"
            placeholder="📍 Vendndodhja..."
            value={location}
            onChange={e => setLocation(e.target.value)}
            style={inputStyle}
          />
          <button type="submit" style={btnPrimary}>Filtro</button>
          <button type="button" onClick={handleReset} style={btnSecondary}>Rivendos</button>
        </form>

        {loading && (
          <div style={{ textAlign: 'center', padding: '60px', color: colors.textMuted }}>
            Duke ngarkuar event-et...
          </div>
        )}

        {error && (
          <div style={{ padding: '16px', backgroundColor: '#ef444422', border: '1px solid #ef4444', borderRadius: '10px', color: '#ef4444', marginBottom: '24px' }}>
            ⚠️ {error}
          </div>
        )}

        {!loading && !error && (
          <>
            {/* Task 4.7 AC — Upcoming Events */}
            <section style={{ marginBottom: '56px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '24px' }}>
                <h2 style={{ color: colors.textMain, fontSize: '22px', fontWeight: '700', margin: 0 }}>
                  🗓 Event-et e Ardhshme
                </h2>
                <span style={{
                  backgroundColor: colors.accent + '22', color: colors.accent,
                  border: `1px solid ${colors.accent}44`, borderRadius: '20px',
                  padding: '2px 12px', fontSize: '13px', fontWeight: '600'
                }}>
                  {upcoming.length}
                </span>
              </div>

              {upcoming.length === 0 ? (
                <EmptyState message="Nuk ka event-e të ardhshme." icon="📭" />
              ) : (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '24px' }}>
                  {upcoming.map(event => (
                    <EventCard key={event.id} event={event} />
                  ))}
                </div>
              )}
            </section>

            {/* Task 4.7 AC — Historia */}
            <section>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '24px' }}>
                <h2 style={{ color: colors.textMuted, fontSize: '22px', fontWeight: '700', margin: 0 }}>
                  📁 Historia
                </h2>
                <span style={{
                  backgroundColor: colors.inputBg, color: colors.textMuted,
                  border: `1px solid ${colors.border}`, borderRadius: '20px',
                  padding: '2px 12px', fontSize: '13px', fontWeight: '600'
                }}>
                  {history.length}
                </span>
              </div>

              {history.length === 0 ? (
                <EmptyState message="Nuk ka event-e të kaluara." icon="🗂" />
              ) : (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '24px' }}>
                  {history.map(event => (
                    <EventCard key={event.id} event={event} isPast />
                  ))}
                </div>
              )}
            </section>
          </>
        )}
      </div>
    </div>
  )
}

// ─── Event Card ───────────────────────────────────────────────────
// Task 4.7 AC: tregon titullin, datën, vendndodhjen dhe banner-in
function EventCard({ event, isPast = false }) {
  const formattedDate = new Date(event.date_time).toLocaleString('sq-AL', {
    weekday: 'short', year: 'numeric', month: 'short',
    day: 'numeric', hour: '2-digit', minute: '2-digit'
  })

  const isFull = event.available_spots === 0

  return (
    <Link
      to={`/events/${event.id}`}
      style={{ textDecoration: 'none' }}
    >
      <div style={{
        backgroundColor: colors.cardBg,
        borderRadius: '16px',
        overflow: 'hidden',
        border: `1px solid ${colors.border}`,
        opacity: isPast ? 0.7 : 1,
        transition: 'transform 0.2s, box-shadow 0.2s',
        cursor: 'pointer',
      }}
        onMouseEnter={e => {
          e.currentTarget.style.transform = 'translateY(-4px)'
          e.currentTarget.style.boxShadow = `0 8px 32px ${colors.accent}33`
        }}
        onMouseLeave={e => {
          e.currentTarget.style.transform = 'translateY(0)'
          e.currentTarget.style.boxShadow = 'none'
        }}
      >
        {/* AC: Banner */}
        <div style={{ position: 'relative', height: '180px', overflow: 'hidden' }}>
          {event.banner_url ? (
            <img
              src={event.banner_url}
              alt={event.title}
              style={{ width: '100%', height: '100%', objectFit: 'cover' }}
            />
          ) : (
            <div style={{
              width: '100%', height: '100%',
              background: `linear-gradient(135deg, #252142, #2d1f4e)`,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: '52px'
            }}>
              📅
            </div>
          )}
          {isPast && (
            <div style={{
              position: 'absolute', top: '12px', left: '12px',
              backgroundColor: '#00000088', color: colors.textMuted,
              padding: '4px 10px', borderRadius: '20px', fontSize: '12px', fontWeight: '600'
            }}>
              I Kaluar
            </div>
          )}
          {isFull && !isPast && (
            <div style={{
              position: 'absolute', top: '12px', right: '12px',
              backgroundColor: colors.danger + 'cc', color: '#fff',
              padding: '4px 10px', borderRadius: '20px', fontSize: '12px', fontWeight: '700'
            }}>
              Plotë
            </div>
          )}
        </div>

        <div style={{ padding: '20px' }}>
          {/* AC: Titulli */}
          <h3 style={{ color: colors.textMain, fontSize: '17px', fontWeight: '700', margin: '0 0 12px', lineHeight: '1.3' }}>
            {event.title}
          </h3>

          {/* AC: Data */}
          <p style={{ color: colors.textMuted, fontSize: '13px', margin: '0 0 6px', display: 'flex', alignItems: 'center', gap: '6px' }}>
            📅 {formattedDate}
          </p>

          {/* AC: Vendndodhja */}
          <p style={{ color: colors.textMuted, fontSize: '13px', margin: '0 0 16px', display: 'flex', alignItems: 'center', gap: '6px' }}>
            📍 {event.location}
          </p>

          {/* Task 4.9 AC — RSVP info në card */}
          <div style={{
            display: 'flex', justifyContent: 'space-between', alignItems: 'center',
            paddingTop: '14px', borderTop: `1px solid ${colors.border}`
          }}>
            <span style={{ color: colors.textMuted, fontSize: '13px' }}>
              👥 {event.rsvp_count} RSVP
            </span>
            {event.available_spots !== null && !isPast && (
              <span style={{
                fontSize: '12px', fontWeight: '600', padding: '3px 10px', borderRadius: '20px',
                backgroundColor: isFull ? colors.danger + '22' : colors.success + '22',
                color: isFull ? colors.danger : colors.success,
                border: `1px solid ${isFull ? colors.danger + '44' : colors.success + '44'}`
              }}>
                {isFull ? 'Plotë' : `${event.available_spots} vende të lira`}
              </span>
            )}
          </div>
        </div>
      </div>
    </Link>
  )
}

// ─── Empty State ──────────────────────────────────────────────────
function EmptyState({ message, icon }) {
  return (
    <div style={{
      textAlign: 'center', padding: '48px',
      backgroundColor: colors.cardBg, borderRadius: '16px',
      border: `1px solid ${colors.border}`
    }}>
      <p style={{ fontSize: '36px', marginBottom: '12px' }}>{icon}</p>
      <p style={{ color: colors.textMuted, fontSize: '15px', margin: 0 }}>{message}</p>
    </div>
  )
}

// ─── Styles ───────────────────────────────────────────────────────
const inputStyle = {
  flex: 1, minWidth: '180px', padding: '10px 14px',
  backgroundColor: colors.inputBg, color: colors.textMain,
  border: `1px solid ${colors.border}`, borderRadius: '8px',
  fontSize: '14px', outline: 'none',
}

const btnPrimary = {
  padding: '10px 22px', backgroundColor: colors.accent, color: '#fff',
  border: 'none', borderRadius: '8px', fontSize: '14px',
  fontWeight: '600', cursor: 'pointer',
}

const btnSecondary = {
  padding: '10px 22px', backgroundColor: 'transparent', color: colors.textMuted,
  border: `1px solid ${colors.border}`, borderRadius: '8px',
  fontSize: '14px', fontWeight: '600', cursor: 'pointer',
}
