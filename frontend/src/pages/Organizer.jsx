import { useState, useEffect } from "react"
import { Link } from "react-router-dom"

const colors = {
  bgDark: '#0f172a',
  cardBg: '#1e293b',
  inputBg: '#0f172a',
  textMain: '#ffffff',
  textMuted: '#94a3b8',
  accent: '#6366f1',
  border: '#334155',
  error: '#ef4444',
  green: '#10b981',
}

export default function Organizer() {
  const [events, setEvents] = useState([])
  const [loading, setLoading] = useState(true)
  const token = localStorage.getItem("token")

  useEffect(() => {
    fetch("http://localhost:8000/api/events", {
      headers: { "Authorization": `Bearer ${token}` }
    })
      .then(r => r.json())
      .then(data => { setEvents(data); setLoading(false) })
      .catch(() => setLoading(false))
  }, [])

  async function handleCancel(eventId) {
    if (!window.confirm("Are you sure you want to cancel this event?")) return
    try {
      const res = await fetch(`http://localhost:8000/api/events/${eventId}/cancel`, {
        method: 'PATCH',
        headers: { "Authorization": `Bearer ${token}` }
      })
      if (res.ok) {
        setEvents(events.map(e => e.id === eventId ? { ...e, status: 'cancelled' } : e))
      }
    } catch (err) {
      console.error(err)
    }
  }

  async function handleArchive(eventId) {
    if (!window.confirm("Archive this event?")) return
    try {
      const res = await fetch(`http://localhost:8000/api/events/${eventId}/archive`, {
        method: 'PATCH',
        headers: { "Authorization": `Bearer ${token}` }
      })
      if (res.ok) {
        setEvents(events.map(e => e.id === eventId ? { ...e, status: 'past' } : e))
      }
    } catch (err) {
      console.error(err)
    }
  }

  const statusColor = (status) => {
    if (status === 'upcoming') return { bg: 'rgba(16,185,129,0.15)', color: '#10b981' }
    if (status === 'cancelled') return { bg: 'rgba(239,68,68,0.15)', color: '#ef4444' }
    return { bg: 'rgba(148,163,184,0.15)', color: '#94a3b8' }
  }

  return (
    <div style={{ backgroundColor: colors.bgDark, minHeight: '100vh', padding: '40px 20px', fontFamily: "'Inter', sans-serif" }}>
      <div style={{ maxWidth: '1200px', margin: '0 auto' }}>

        {/* HEADER */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '40px', flexWrap: 'wrap', gap: '16px' }}>
          <div>
            <p style={{ color: colors.accent, fontSize: '12px', fontWeight: '700', letterSpacing: '3px', textTransform: 'uppercase', margin: '0 0 10px' }}>ORGANIZER</p>
            <h2 style={{ fontSize: '32px', fontWeight: '800', color: colors.textMain, margin: '0 0 8px', letterSpacing: '-1px' }}>My Events</h2>
            <p style={{ color: colors.textMuted, fontSize: '15px', margin: 0 }}>Manage your events and see who has signed up</p>
          </div>
          <Link to="/create-event" style={{ padding: '13px 24px', backgroundColor: colors.accent, color: '#fff', borderRadius: '10px', textDecoration: 'none', fontSize: '14px', fontWeight: '700', boxShadow: '0 4px 20px rgba(99,102,241,0.4)' }}>
            + Create Event
          </Link>
        </div>

        {/* STATS */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '16px', marginBottom: '40px' }}>
          {[
            { label: 'Total Events', value: events.length, icon: '📅', color: colors.accent },
            { label: 'Upcoming', value: events.filter(e => e.status === 'upcoming').length, icon: '✅', color: '#10b981' },
            { label: 'Past', value: events.filter(e => e.status === 'past').length, icon: '📦', color: '#f59e0b' },
            { label: 'Cancelled', value: events.filter(e => e.status === 'cancelled').length, icon: '❌', color: '#ef4444' },
          ].map((stat, i) => (
            <div key={i} style={{ backgroundColor: colors.cardBg, padding: '24px', borderRadius: '16px', border: `1px solid ${colors.border}`, textAlign: 'center' }}>
              <p style={{ fontSize: '28px', margin: '0 0 8px' }}>{stat.icon}</p>
              <p style={{ fontSize: '28px', fontWeight: '800', color: stat.color, margin: '0 0 4px', letterSpacing: '-1px' }}>{stat.value}</p>
              <p style={{ fontSize: '12px', color: colors.textMuted, margin: 0, textTransform: 'uppercase', letterSpacing: '1px' }}>{stat.label}</p>
            </div>
          ))}
        </div>

        {/* EVENTS */}
        {loading ? (
          <p style={{ color: colors.textMuted }}>Loading events...</p>
        ) : events.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '80px', backgroundColor: colors.cardBg, borderRadius: '20px', border: `1px solid ${colors.border}` }}>
            <p style={{ fontSize: '48px', marginBottom: '16px' }}>📅</p>
            <h3 style={{ color: colors.textMain, fontSize: '22px', fontWeight: '700', margin: '0 0 12px' }}>No events yet</h3>
            <p style={{ color: colors.textMuted, marginBottom: '28px' }}>Create your first event and start inviting people!</p>
            <Link to="/create-event" style={{ padding: '13px 28px', backgroundColor: colors.accent, color: '#fff', borderRadius: '10px', textDecoration: 'none', fontSize: '14px', fontWeight: '600' }}>
              Create First Event →
            </Link>
          </div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(340px, 1fr))', gap: '24px' }}>
            {events.map(event => {
              const sc = statusColor(event.status)
              return (
                <div key={event.id} style={{ backgroundColor: colors.cardBg, borderRadius: '20px', overflow: 'hidden', border: `1px solid ${colors.border}` }}>
                  {event.banner_url ? (
                    <img src={event.banner_url} alt="Banner" style={{ width: '100%', height: '180px', objectFit: 'cover' }} />
                  ) : (
                    <div style={{ width: '100%', height: '180px', background: 'linear-gradient(135deg, #4f46e5, #7c3aed)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '48px' }}>📅</div>
                  )}
                  <div style={{ padding: '22px' }}>

                    {/* Title + Status */}
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '10px' }}>
                      <h3 style={{ color: colors.textMain, fontSize: '17px', fontWeight: '700', margin: 0, flex: 1 }}>{event.title}</h3>
                      <span style={{ fontSize: '11px', padding: '3px 10px', borderRadius: '20px', backgroundColor: sc.bg, color: sc.color, fontWeight: '700', marginLeft: '8px', flexShrink: 0 }}>
                        {event.status || 'upcoming'}
                      </span>
                    </div>

                    <p style={{ color: colors.textMuted, fontSize: '13px', margin: '0 0 4px' }}>📍 {event.location}</p>
                    <p style={{ color: colors.textMuted, fontSize: '13px', margin: '0 0 4px' }}>
                      🗓️ {event.date_time ? new Date(event.date_time).toLocaleString('en-US', { dateStyle: 'medium', timeStyle: 'short' }) : ''}
                    </p>
                    {event.capacity && (
                      <p style={{ color: colors.textMuted, fontSize: '13px', margin: '0 0 16px' }}>👥 Capacity: {event.capacity}</p>
                    )}

                    {/* Actions */}
                    <div style={{ display: 'flex', gap: '8px', marginTop: '16px' }}>
                      <button
                        onClick={() => handleArchive(event.id)}
                        style={{ flex: 1, padding: '9px', backgroundColor: 'rgba(245,158,11,0.1)', color: '#f59e0b', border: '1px solid rgba(245,158,11,0.3)', borderRadius: '8px', fontSize: '12px', fontWeight: '600', cursor: 'pointer' }}>
                        📦 Archive
                      </button>
                      <button
                        onClick={() => handleCancel(event.id)}
                        style={{ flex: 1, padding: '9px', backgroundColor: 'rgba(239,68,68,0.1)', color: colors.error, border: `1px solid rgba(239,68,68,0.3)`, borderRadius: '8px', fontSize: '12px', fontWeight: '600', cursor: 'pointer' }}>
                        ❌ Cancel
                      </button>
                    </div>
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