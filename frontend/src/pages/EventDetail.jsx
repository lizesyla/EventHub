import { useState, useEffect } from "react"
import { useParams, useNavigate, Link } from "react-router-dom"

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

function parseToken() {
  try {
    const token = localStorage.getItem("token")
    if (!token) return null
    return JSON.parse(atob(token.split('.')[1]))
  } catch {
    return null
  }
}

export default function EventDetail() {
  const { id } = useParams()
  const navigate = useNavigate()

  const [event, setEvent] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  const [rsvpLoading, setRsvpLoading] = useState(false)
  const [rsvpMessage, setRsvpMessage] = useState(null)
  const [hasRsvp, setHasRsvp] = useState(false)

  const payload = parseToken()
  const isLoggedIn = !!payload
  const role = payload?.role || null
  const userId = payload?.id || payload?.user_id || null

  
  const fetchEvent = async () => {
    setLoading(true)
    setError(null)
    try {
      const res = await fetch(`http://localhost:8000/api/events/${id}`)
      if (!res.ok) throw new Error("Eventi nuk u gjet.")
      const data = await res.json()
      setEvent(data)
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }


  const checkMyRsvp = async () => {
    if (!isLoggedIn) return
    try {
      const token = localStorage.getItem("token")
      const res = await fetch(`http://localhost:8000/api/events/${id}/rsvp/me`, {
        headers: { Authorization: `Bearer ${token}` }
      })
      if (res.ok) {
        const data = await res.json()
        setHasRsvp(!!data.has_rsvp)
      }
    } catch {
     
    }
  }

  useEffect(() => {
    fetchEvent()
    checkMyRsvp()
  }, [id])


  const handleRsvp = async () => {
    if (!isLoggedIn) { navigate("/login"); return }
    setRsvpLoading(true)
    setRsvpMessage(null)
    try {
      const token = localStorage.getItem("token")
      const res = await fetch(`http://localhost:8000/api/events/${id}/rsvp`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` }
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.detail || "Gabim gjatë RSVP.")
      setHasRsvp(true)
      setRsvpMessage({ type: "success", text: data.message })
      fetchEvent() // rifresko numrin e RSVP-ve
    } catch (err) {
      setRsvpMessage({ type: "error", text: err.message })
    } finally {
      setRsvpLoading(false)
    }
  }

  
  const handleCancelRsvp = async () => {
    if (!window.confirm("A je i sigurt që dëshiron të anulosh RSVP-në?")) return
    setRsvpLoading(true)
    setRsvpMessage(null)
    try {
      const token = localStorage.getItem("token")
      const res = await fetch(`http://localhost:8000/api/events/${id}/rsvp`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` }
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.detail || "Gabim gjatë anulimit.")
      setHasRsvp(false)
      setRsvpMessage({ type: "success", text: data.message })
      fetchEvent()
    } catch (err) {
      setRsvpMessage({ type: "error", text: err.message })
    } finally {
      setRsvpLoading(false)
    }
  }

  if (loading) return (
    <div style={{ backgroundColor: colors.bgDark, minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <p style={{ color: colors.textMuted, fontSize: '16px' }}>Duke ngarkuar eventin...</p>
    </div>
  )

  if (error) return (
    <div style={{ backgroundColor: colors.bgDark, minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', gap: '16px' }}>
      <p style={{ color: colors.danger, fontSize: '16px' }}>⚠️ {error}</p>
      <Link to="/events" style={{ color: colors.accent, fontSize: '14px' }}>← Kthehu te Events</Link>
    </div>
  )

  if (!event) return null

  const formattedDate = new Date(event.date_time).toLocaleString('sq-AL', {
    weekday: 'long', year: 'numeric', month: 'long',
    day: 'numeric', hour: '2-digit', minute: '2-digit'
  })

  const isFull = event.is_full
  const isPast = event.is_past
  const isCancelled = event.status === "cancelled"

  const spotsPercent = event.capacity
    ? Math.min(100, Math.round((event.rsvp_count / event.capacity) * 100))
    : null

  return (
    <div style={{ backgroundColor: colors.bgDark, minHeight: '100vh', fontFamily: "'Inter', sans-serif" }}>

      {/* ── Banner ── */}
      <div style={{ width: '100%', height: '340px', position: 'relative', overflow: 'hidden' }}>
        {event.banner_url ? (
          <img
            src={event.banner_url}
            alt={event.title}
            style={{ width: '100%', height: '100%', objectFit: 'cover' }}
          />
        ) : (
          <div style={{
            width: '100%', height: '100%',
            background: 'linear-gradient(135deg, #252142, #2d1f4e)',
            display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '80px'
          }}>
            📅
          </div>
        )}

        {/* Overlay gradient */}
        <div style={{
          position: 'absolute', inset: 0,
          background: 'linear-gradient(to bottom, transparent 40%, #0f0c1b 100%)'
        }} />

        {/* Back button */}
        <Link to="/events" style={{
          position: 'absolute', top: '20px', left: '20px',
          backgroundColor: '#00000066', color: '#fff',
          padding: '8px 16px', borderRadius: '8px',
          textDecoration: 'none', fontSize: '14px', fontWeight: '600',
          backdropFilter: 'blur(4px)'
        }}>
          ← Events
        </Link>

        {/* Status badge */}
        {(isPast || isCancelled) && (
          <div style={{
            position: 'absolute', top: '20px', right: '20px',
            backgroundColor: isCancelled ? colors.danger + 'cc' : '#00000088',
            color: '#fff', padding: '6px 14px', borderRadius: '20px',
            fontSize: '13px', fontWeight: '700'
          }}>
            {isCancelled ? '🚫 Anuluar' : '🕐 I Kaluar'}
          </div>
        )}
      </div>

      {/* ── Content ── */}
      <div style={{ maxWidth: '860px', margin: '-40px auto 0', padding: '0 20px 60px', position: 'relative' }}>

        {/* ── Title + Meta ── */}
        <div style={{
          backgroundColor: colors.cardBg, borderRadius: '16px',
          border: `1px solid ${colors.border}`, padding: '32px',
          marginBottom: '24px'
        }}>
          <h1 style={{ color: colors.textMain, fontSize: '32px', fontWeight: '800', margin: '0 0 20px', lineHeight: '1.2' }}>
            {event.title}
          </h1>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            <MetaRow icon="📅" label="Data" value={formattedDate} />
            <MetaRow icon="📍" label="Vendndodhja" value={event.location} />
            {event.description && (
              <div style={{ marginTop: '16px', paddingTop: '16px', borderTop: `1px solid ${colors.border}` }}>
                <p style={{ color: colors.textMuted, fontSize: '13px', fontWeight: '600', margin: '0 0 8px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                  Përshkrimi
                </p>
                <p style={{ color: colors.textMain, fontSize: '15px', lineHeight: '1.7', margin: 0 }}>
                  {event.description}
                </p>
              </div>
            )}
          </div>
        </div>

        {/* ── Task 4.9 AC — RSVP Stats ── */}
        <div style={{
          backgroundColor: colors.cardBg, borderRadius: '16px',
          border: `1px solid ${colors.border}`, padding: '28px',
          marginBottom: '24px'
        }}>
          <h2 style={{ color: colors.textMain, fontSize: '18px', fontWeight: '700', margin: '0 0 20px' }}>
            👥 Pjesëmarrja
          </h2>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: '16px', marginBottom: '20px' }}>
            <StatBox
              value={event.rsvp_count}
              label="RSVP të konfirmuara"
              color={colors.accent}
            />
            {event.capacity !== null && (
              <>
                <StatBox
                  value={event.capacity}
                  label="Kapaciteti total"
                  color={colors.textMuted}
                />
                <StatBox
                  value={event.available_spots}
                  label="Vende të lira"
                  color={event.available_spots === 0 ? colors.danger : colors.success}
                />
              </>
            )}
          </div>

          {/* Progress bar kapaciteti */}
          {spotsPercent !== null && (
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
                <span style={{ color: colors.textMuted, fontSize: '12px' }}>Mbushja</span>
                <span style={{ color: colors.textMuted, fontSize: '12px' }}>{spotsPercent}%</span>
              </div>
              <div style={{ backgroundColor: colors.inputBg, borderRadius: '99px', height: '8px', overflow: 'hidden' }}>
                <div style={{
                  height: '100%', borderRadius: '99px',
                  width: `${spotsPercent}%`,
                  backgroundColor: spotsPercent >= 100 ? colors.danger : spotsPercent > 75 ? '#f59e0b' : colors.success,
                  transition: 'width 0.5s ease'
                }} />
              </div>
            </div>
          )}
        </div>

        {/* ── Task 5.1 / 5.2 — RSVP Button ── */}
        {!isPast && !isCancelled && role === 'attendee' && (
          <div style={{
            backgroundColor: colors.cardBg, borderRadius: '16px',
            border: `1px solid ${colors.border}`, padding: '28px',
            marginBottom: '24px'
          }}>
            <h2 style={{ color: colors.textMain, fontSize: '18px', fontWeight: '700', margin: '0 0 16px' }}>
              🎟 Regjistrohu
            </h2>

            {rsvpMessage && (
              <div style={{
                padding: '12px 16px', borderRadius: '8px', marginBottom: '16px',
                backgroundColor: rsvpMessage.type === 'success' ? colors.success + '22' : colors.danger + '22',
                border: `1px solid ${rsvpMessage.type === 'success' ? colors.success + '44' : colors.danger + '44'}`,
                color: rsvpMessage.type === 'success' ? colors.success : colors.danger,
                fontSize: '14px'
              }}>
                {rsvpMessage.type === 'success' ? '✅' : '⚠️'} {rsvpMessage.text}
              </div>
            )}

            {hasRsvp ? (
              <div style={{ display: 'flex', alignItems: 'center', gap: '16px', flexWrap: 'wrap' }}>
                <div style={{
                  display: 'flex', alignItems: 'center', gap: '8px',
                  backgroundColor: colors.success + '22', border: `1px solid ${colors.success + '44'}`,
                  color: colors.success, padding: '10px 18px', borderRadius: '8px',
                  fontSize: '14px', fontWeight: '600'
                }}>
                  ✅ Ke bërë RSVP për këtë event
                </div>
                <button
                  onClick={handleCancelRsvp}
                  disabled={rsvpLoading}
                  style={{
                    padding: '10px 18px', backgroundColor: 'transparent',
                    color: colors.danger, border: `1px solid ${colors.danger}`,
                    borderRadius: '8px', fontSize: '14px', fontWeight: '600',
                    cursor: rsvpLoading ? 'not-allowed' : 'pointer', opacity: rsvpLoading ? 0.6 : 1
                  }}
                >
                  {rsvpLoading ? 'Duke anuluar...' : 'Anulo RSVP'}
                </button>
              </div>
            ) : isFull ? (
              <div style={{
                backgroundColor: colors.danger + '22', border: `1px solid ${colors.danger + '44'}`,
                color: colors.danger, padding: '12px 18px', borderRadius: '8px',
                fontSize: '14px', fontWeight: '600'
              }}>
                🚫 Ky event është plotë — nuk ka më vende të lira.
              </div>
            ) : (
              <button
                onClick={handleRsvp}
                disabled={rsvpLoading}
                style={{
                  padding: '12px 28px', backgroundColor: colors.accent, color: '#fff',
                  border: 'none', borderRadius: '10px', fontSize: '15px', fontWeight: '700',
                  cursor: rsvpLoading ? 'not-allowed' : 'pointer', opacity: rsvpLoading ? 0.7 : 1,
                  boxShadow: `0 4px 20px ${colors.accent}55`
                }}
              >
                {rsvpLoading ? 'Duke regjistruar...' : '🎟 Bëj RSVP'}
              </button>
            )}
          </div>
        )}

        {/* Nëse nuk është i loguar */}
        {!isLoggedIn && !isPast && !isCancelled && (
          <div style={{
            backgroundColor: colors.cardBg, borderRadius: '16px',
            border: `1px solid ${colors.border}`, padding: '28px',
            marginBottom: '24px', textAlign: 'center'
          }}>
            <p style={{ color: colors.textMuted, fontSize: '15px', margin: '0 0 16px' }}>
              Duhet të jesh i loguar për të bërë RSVP.
            </p>
            <Link to="/login" style={{
              padding: '12px 28px', backgroundColor: colors.accent, color: '#fff',
              borderRadius: '10px', textDecoration: 'none', fontSize: '15px', fontWeight: '700'
            }}>
              Kyçu
            </Link>
          </div>
        )}

        {/* Event i kaluar ose anuluar */}
        {(isPast || isCancelled) && (
          <div style={{
            backgroundColor: colors.cardBg, borderRadius: '16px',
            border: `1px solid ${colors.border}`, padding: '24px',
            marginBottom: '24px', textAlign: 'center'
          }}>
            <p style={{ color: colors.textMuted, fontSize: '15px', margin: 0 }}>
              {isCancelled ? '🚫 Ky event është anuluar.' : '🕐 Ky event ka përfunduar — RSVP nuk është i mundur.'}
            </p>
          </div>
        )}

      </div>
    </div>
  )
}


function MetaRow({ icon, label, value }) {
  return (
    <div style={{ display: 'flex', alignItems: 'flex-start', gap: '10px' }}>
      <span style={{ fontSize: '16px', marginTop: '1px' }}>{icon}</span>
      <div>
        <span style={{ color: colors.textMuted, fontSize: '12px', fontWeight: '600', textTransform: 'uppercase', letterSpacing: '0.5px', display: 'block' }}>
          {label}
        </span>
        <span style={{ color: colors.textMain, fontSize: '15px' }}>{value}</span>
      </div>
    </div>
  )
}

function StatBox({ value, label, color }) {
  return (
    <div style={{
      backgroundColor: colors.inputBg, borderRadius: '12px',
      padding: '18px', border: `1px solid ${colors.border}`, textAlign: 'center'
    }}>
      <p style={{ color, fontSize: '32px', fontWeight: '800', margin: '0 0 6px' }}>{value}</p>
      <p style={{ color: colors.textMuted, fontSize: '12px', margin: 0 }}>{label}</p>
    </div>
  )
}
