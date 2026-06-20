import { Link } from "react-router-dom"
import { useState, useEffect } from "react"

const colors = {
  bgDark: '#0f172a',
  cardBg: '#1e293b',
  textMain: '#ffffff',
  textMuted: '#94a3b8',
  accent: '#6366f1',
  border: '#334155',
  green: '#10b981',
  error: '#ef4444',
}

function parseRole() {
  try {
    const token = localStorage.getItem("token")
    if (!token) return null
    const payload = JSON.parse(atob(token.split('.')[1]))
    return payload.role || null
  } catch {
    return null
  }
}

export default function Events() {
  const [events, setEvents] = useState([])
  const [loading, setLoading] = useState(true)
  const [rsvpMsg, setRsvpMsg] = useState({ id: null, msg: '', type: '' })
  const [rsvpLoading, setRsvpLoading] = useState(null)
  const token = localStorage.getItem("token")
  const role = parseRole()

  useEffect(() => {
    fetchEvents()
  }, [])

  function fetchEvents() {
    const headers = token ? { 'Authorization': `Bearer ${token}` } : {}
    fetch("http://localhost:8000/api/events", { headers })
      .then(r => r.json())
      .then(data => { setEvents(Array.isArray(data) ? data : []); setLoading(false) })
      .catch(() => setLoading(false))
  }

  async function handleRSVP(eventId, alreadyRsvped) {
    if (!token) {
      setRsvpMsg({ id: eventId, msg: 'Please sign in to RSVP for this event.', type: 'warn' })
      setTimeout(() => setRsvpMsg({ id: null, msg: '', type: '' }), 3000)
      return
    }

    setRsvpLoading(eventId)
    try {
      const res = await fetch(`http://localhost:8000/api/events/${eventId}/rsvp`, {
        method: alreadyRsvped ? 'DELETE' : 'POST',
        headers: { 'Authorization': `Bearer ${token}` }
      })
      const data = await res.json()

      if (res.ok) {
        setEvents(prev => prev.map(e => {
          if (e.id !== eventId) return e
          const newGoingCount = alreadyRsvped ? e.going_count - 1 : e.going_count + 1
          const newSpotsLeft = e.capacity != null ? e.capacity - newGoingCount : null
          return {
            ...e,
            going_count: newGoingCount,
            spots_left: newSpotsLeft,
            is_full: e.capacity != null ? newGoingCount >= e.capacity : false,
            user_has_rsvped: !alreadyRsvped
          }
        }))
        setRsvpMsg({ id: eventId, msg: alreadyRsvped ? 'RSVP cancelled.' : 'RSVP confirmed!', type: 'success' })
      } else {
        setRsvpMsg({ id: eventId, msg: data.detail || 'Something went wrong.', type: 'warn' })
      }
    } catch {
      setRsvpMsg({ id: eventId, msg: 'Could not connect to the server.', type: 'warn' })
    } finally {
      setRsvpLoading(null)
      setTimeout(() => setRsvpMsg({ id: null, msg: '', type: '' }), 2500)
    }
  }

  return (
    <div style={{ backgroundColor: colors.bgDark, minHeight: '100vh', padding: '60px 20px', fontFamily: "'Inter', sans-serif" }}>
      <div style={{ maxWidth: '1200px', margin: '0 auto' }}>

        <div style={{ marginBottom: '48px' }}>
          <p style={{ color: colors.accent, fontSize: '12px', fontWeight: '700', letterSpacing: '3px', textTransform: 'uppercase', margin: '0 0 12px' }}>DISCOVER</p>
          <h1 style={{ fontSize: '40px', fontWeight: '800', color: colors.textMain, margin: '0 0 12px', letterSpacing: '-1.5px' }}>
            Upcoming Events
          </h1>
          <p style={{ color: colors.textMuted, fontSize: '16px', margin: 0 }}>
            {loading ? '' : events.length > 0 ? `${events.length} event${events.length > 1 ? 's' : ''} available` : 'No events yet'}
          </p>
        </div>

        {loading ? (
          <div style={{ textAlign: 'center', padding: '80px' }}>
            <p style={{ color: colors.textMuted, fontSize: '16px' }}>⏳ Loading events...</p>
          </div>
        ) : events.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '80px', backgroundColor: colors.cardBg, borderRadius: '24px', border: `1px solid ${colors.border}` }}>
            <p style={{ fontSize: '52px', marginBottom: '16px' }}>📅</p>
            <h3 style={{ color: colors.textMain, fontSize: '22px', fontWeight: '700', margin: '0 0 12px' }}>No events yet</h3>
            <p style={{ color: colors.textMuted, margin: '0 0 28px' }}>Check back soon — events will appear here!</p>
            {!token && (
              <Link to="/register" style={{ padding: '13px 28px', backgroundColor: colors.accent, color: '#fff', borderRadius: '10px', textDecoration: 'none', fontSize: '14px', fontWeight: '600' }}>
                Create an account →
              </Link>
            )}
          </div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(340px, 1fr))', gap: '24px' }}>
            {events.map(event => {
              const fullyBooked = event.capacity != null && event.is_full && !event.user_has_rsvped
              const disabled = event.status === 'cancelled' || rsvpLoading === event.id || fullyBooked

              return (
                <div key={event.id} style={{ backgroundColor: colors.cardBg, borderRadius: '20px', overflow: 'hidden', border: `1px solid ${colors.border}`, transition: 'transform 0.3s ease, box-shadow 0.3s ease' }}
                  onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-6px)'; e.currentTarget.style.boxShadow = '0 20px 60px rgba(99,102,241,0.15)' }}
                  onMouseLeave={e => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = 'none' }}
                >
                  {event.banner_url ? (
                    <img src={event.banner_url} alt="Banner" style={{ width: '100%', height: '200px', objectFit: 'cover' }} />
                  ) : (
                    <div style={{ width: '100%', height: '200px', background: 'linear-gradient(135deg, #4f46e5, #7c3aed)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '56px' }}>
                      📅
                    </div>
                  )}

                  <div style={{ padding: '24px' }}>
                    {event.status && event.status !== 'upcoming' && (
                      <span style={{ fontSize: '11px', padding: '3px 10px', borderRadius: '20px', backgroundColor: event.status === 'cancelled' ? 'rgba(239,68,68,0.15)' : 'rgba(148,163,184,0.15)', color: event.status === 'cancelled' ? colors.error : colors.textMuted, fontWeight: '700', display: 'inline-block', marginBottom: '10px' }}>
                        {event.status}
                      </span>
                    )}

                    <h3 style={{ color: colors.textMain, fontSize: '18px', fontWeight: '700', margin: '0 0 12px', letterSpacing: '-0.3px' }}>{event.title}</h3>

                    <p style={{ color: colors.textMuted, fontSize: '13px', margin: '0 0 6px' }}>📍 {event.location}</p>
                    <p style={{ color: colors.textMuted, fontSize: '13px', margin: '0 0 6px' }}>
                      🗓️ {event.date_time ? new Date(event.date_time).toLocaleString('en-US', { dateStyle: 'medium', timeStyle: 'short' }) : ''}
                    </p>

                    {event.capacity != null && (
                      <p style={{ color: event.is_full ? colors.error : colors.textMuted, fontSize: '13px', margin: '0 0 6px', fontWeight: event.is_full ? '700' : '400' }}>
                        {event.is_full ? '🔴 Fully booked' : `👥 ${event.spots_left} spot${event.spots_left === 1 ? '' : 's'} left of ${event.capacity}`}
                      </p>
                    )}

                    {event.description && (
                      <p style={{ color: colors.textMuted, fontSize: '14px', margin: '12px 0 0', lineHeight: '1.6', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                        {event.description}
                      </p>
                    )}

                    {rsvpMsg.id === event.id && (
                      <div style={{ marginTop: '12px', padding: '10px 14px', backgroundColor: rsvpMsg.type === 'warn' ? 'rgba(245,158,11,0.1)' : 'rgba(16,185,129,0.1)', border: `1px solid ${rsvpMsg.type === 'warn' ? 'rgba(245,158,11,0.3)' : 'rgba(16,185,129,0.3)'}`, borderRadius: '8px', color: rsvpMsg.type === 'warn' ? '#f59e0b' : colors.green, fontSize: '13px', fontWeight: '600' }}>
                        ℹ️ {rsvpMsg.msg}
                      </div>
                    )}

                    {role !== 'admin' && (
                      <button
                        onClick={() => handleRSVP(event.id, event.user_has_rsvped)}
                        disabled={disabled}
                        style={{
                          width: '100%',
                          marginTop: '20px',
                          padding: '12px',
                          backgroundColor: disabled
                            ? 'rgba(148,163,184,0.1)'
                            : event.user_has_rsvped
                              ? 'transparent'
                              : token ? colors.accent : 'transparent',
                          color: disabled
                            ? colors.textMuted
                            : event.user_has_rsvped
                              ? colors.error
                              : token ? '#fff' : colors.accent,
                          border: event.user_has_rsvped
                            ? `1px solid ${colors.error}`
                            : disabled
                              ? `1px solid ${colors.border}`
                              : token ? 'none' : `1px solid ${colors.accent}`,
                          borderRadius: '10px',
                          fontSize: '14px',
                          fontWeight: '700',
                          cursor: disabled ? 'not-allowed' : 'pointer',
                          boxShadow: token && !disabled && !event.user_has_rsvped ? '0 4px 14px rgba(99,102,241,0.4)' : 'none',
                          transition: 'all 0.2s ease'
                        }}
                      >
                        {rsvpLoading === event.id
                          ? 'Processing...'
                          : event.status === 'cancelled'
                            ? 'Event Cancelled'
                            : event.user_has_rsvped
                              ? '❌ Cancel RSVP'
                              : fullyBooked
                                ? 'Fully Booked'
                                : token ? '✅ RSVP Now' : 'Sign in to RSVP'}
                      </button>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}