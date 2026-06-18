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

export default function Events() {
  const [events, setEvents] = useState([])
  const [loading, setLoading] = useState(true)
  const [rsvpMsg, setRsvpMsg] = useState({ id: null, msg: '', type: '' })
  const token = localStorage.getItem("token")

  useEffect(() => {
    fetch("http://localhost:8000/api/events")
      .then(r => r.json())
      .then(data => { setEvents(data); setLoading(false) })
      .catch(() => setLoading(false))

  function handleRSVP(eventId) {
    if (!token) {
      setRsvpMsg({ id: eventId, msg: 'Please sign in to RSVP for this event.', type: 'warn' })
      setTimeout(() => setRsvpMsg({ id: null, msg: '', type: '' }), 3000)
      return
    }
    // Sprint 2 — RSVP logic coming
    setRsvpMsg({ id: eventId, msg: 'RSVP coming in Sprint 2!', type: 'info' })
    setTimeout(() => setRsvpMsg({ id: null, msg: '', type: '' }), 2000)
  }

  return (
    <div style={{ backgroundColor: colors.bgDark, minHeight: '100vh', padding: '60px 20px', fontFamily: "'Inter', sans-serif" }}>
      <div style={{ maxWidth: '1200px', margin: '0 auto' }}>

        {/* HEADER */}
        <div style={{ marginBottom: '48px' }}>
          <p style={{ color: colors.accent, fontSize: '12px', fontWeight: '700', letterSpacing: '3px', textTransform: 'uppercase', margin: '0 0 12px' }}>DISCOVER</p>
          <h1 style={{ fontSize: '40px', fontWeight: '800', color: colors.textMain, margin: '0 0 12px', letterSpacing: '-1.5px' }}>
            Upcoming Events
          </h1>
          <p style={{ color: colors.textMuted, fontSize: '16px', margin: 0 }}>
            {loading ? '' : events.length > 0 ? `${events.length} event${events.length > 1 ? 's' : ''} available` : 'No events yet'}
          </p>
        </div>

<<<<<<< HEAD
        {/* EVENTS */}
        {loading ? (
          <div style={{ textAlign: 'center', padding: '80px' }}>
            <p style={{ color: colors.textMuted, fontSize: '16px' }}>⏳ Loading events...</p>
=======
        <h1 style={{ fontSize: '64px', fontWeight: '800', color: colors.textMain, margin: '0 0 24px', letterSpacing: '-2px', lineHeight: '1.1' }}>
          Your Company Events,<br />
          <span style={{ color: colors.accent }}>All in One Place</span>
        </h1>

        <p style={{ fontSize: '18px', color: colors.textMuted, maxWidth: '560px', margin: '0 auto 48px', lineHeight: '1.7' }}>
          Discover lunch-and-learns, game nights, tech talks and more. Sign up in seconds — never miss what's happening at your company.
        </p>

        <div style={{ display: 'flex', gap: '16px', justifyContent: 'center', flexWrap: 'wrap', marginBottom: '80px' }}>
          <Link to="/register" style={{
            padding: '16px 36px', backgroundColor: colors.accent, color: '#fff',
            borderRadius: '10px', textDecoration: 'none', fontSize: '16px', fontWeight: '700',
            boxShadow: `0 8px 32px ${colors.accent}55`
          }}>
            Get Started — It's Free
          </Link>
          <Link to="/events" style={{
            padding: '16px 36px', backgroundColor: 'transparent', color: colors.textMain,
            borderRadius: '10px', textDecoration: 'none', fontSize: '16px', fontWeight: '600',
            border: `1px solid ${colors.border}`
          }}>
            Browse Events →
          </Link>
        </div>

        {/* STATS */}
        <div style={{ display: 'flex', gap: '60px', justifyContent: 'center', flexWrap: 'wrap' }}>
          {[
            { value: events.length || '0', label: 'Upcoming Events' },
            { value: '2', label: 'User Roles' },
            { value: '100%', label: 'Free to Use' },
          ].map((stat, i) => (
            <div key={i} style={{ textAlign: 'center' }}>
              <p style={{ fontSize: '36px', fontWeight: '800', color: colors.accent, margin: 0 }}>{stat.value}</p>
              <p style={{ fontSize: '13px', color: colors.textMuted, margin: '6px 0 0' }}>{stat.label}</p>
            </div>
          ))}
        </div>
      </div>

      {/* HOW IT WORKS */}
      <div style={{ maxWidth: '1100px', margin: '0 auto', padding: '80px 20px' }}>
        <h2 style={{ textAlign: 'center', color: colors.textMain, fontSize: '36px', fontWeight: '700', marginBottom: '12px' }}>
          How it works
        </h2>
        <p style={{ textAlign: 'center', color: colors.textMuted, fontSize: '16px', marginBottom: '56px' }}>
          Three simple steps to join your next company event
        </p>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '24px' }}>
          {[
            { step: '01', icon: '🔍', title: 'Discover Events', desc: 'Browse upcoming company events — from lunch-and-learns to game nights and tech talks.' },
            { step: '02', icon: '✅', title: 'RSVP Instantly', desc: 'Sign up for events with one click. Cancel anytime. Spots are limited — first come, first served.' },
            { step: '03', icon: '📊', title: 'Track & Manage', desc: 'Admins oversee everything. Everyone stays informed.' },
          ].map((item, i) => (
            <div key={i} style={{ backgroundColor: colors.cardBg, padding: '32px', borderRadius: '16px', border: `1px solid ${colors.border}`, position: 'relative' }}>
              <div style={{ fontSize: '13px', fontWeight: '700', color: colors.accent, marginBottom: '16px', opacity: 0.6 }}>{item.step}</div>
              <div style={{ fontSize: '36px', marginBottom: '16px' }}>{item.icon}</div>
              <h3 style={{ color: colors.textMain, fontSize: '18px', fontWeight: '700', margin: '0 0 12px' }}>{item.title}</h3>
              <p style={{ color: colors.textMuted, fontSize: '14px', lineHeight: '1.6', margin: 0 }}>{item.desc}</p>
            </div>
          ))}
        </div>
      </div>

      {/* PREVIEW EVENTS */}
      <div style={{ backgroundColor: colors.cardBg, padding: '80px 20px' }}>
        <div style={{ maxWidth: '1100px', margin: '0 auto' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '40px' }}>
            <div>
              <h2 style={{ color: colors.textMain, fontSize: '32px', fontWeight: '700', margin: 0 }}>Latest Events</h2>
              <p style={{ color: colors.textMuted, fontSize: '14px', marginTop: '8px' }}>A preview of what's coming up</p>
            </div>
            <Link to="/events" style={{ padding: '10px 20px', backgroundColor: colors.accent + '22', color: colors.accent, borderRadius: '8px', textDecoration: 'none', fontSize: '14px', fontWeight: '600', border: `1px solid ${colors.accent}44` }}>
              View All →
            </Link>
>>>>>>> Remove-Organizer
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
            {events.map(event => (
              <div key={event.id} style={{ backgroundColor: colors.cardBg, borderRadius: '20px', overflow: 'hidden', border: `1px solid ${colors.border}`, transition: 'transform 0.3s ease, box-shadow 0.3s ease' }}
                onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-6px)'; e.currentTarget.style.boxShadow = '0 20px 60px rgba(99,102,241,0.15)' }}
                onMouseLeave={e => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = 'none' }}
              >
                {/* Banner */}
                {event.banner_url ? (
                  <img src={event.banner_url} alt="Banner" style={{ width: '100%', height: '200px', objectFit: 'cover' }} />
                ) : (
                  <div style={{ width: '100%', height: '200px', background: 'linear-gradient(135deg, #4f46e5, #7c3aed)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '56px' }}>
                    📅
                  </div>
                )}

                <div style={{ padding: '24px' }}>
                  {/* Status badge */}
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
                  {event.capacity && (
                    <p style={{ color: colors.textMuted, fontSize: '13px', margin: '0 0 6px' }}>👥 {event.capacity} spots</p>
                  )}

                  {event.description && (
                    <p style={{ color: colors.textMuted, fontSize: '14px', margin: '12px 0 0', lineHeight: '1.6', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                      {event.description}
                    </p>
                  )}

                  {/* RSVP message */}
                  {rsvpMsg.id === event.id && (
                    <div style={{ marginTop: '12px', padding: '10px 14px', backgroundColor: rsvpMsg.type === 'warn' ? 'rgba(245,158,11,0.1)' : 'rgba(99,102,241,0.1)', border: `1px solid ${rsvpMsg.type === 'warn' ? 'rgba(245,158,11,0.3)' : 'rgba(99,102,241,0.3)'}`, borderRadius: '8px', color: rsvpMsg.type === 'warn' ? '#f59e0b' : '#a5b4fc', fontSize: '13px', fontWeight: '600' }}>
                      ℹ️ {rsvpMsg.msg}
                    </div>
                  )}

                  {/* RSVP Button */}
                  <button
                    onClick={() => handleRSVP(event.id)}
                    disabled={event.status === 'cancelled'}
                    style={{
                      width: '100%',
                      marginTop: '20px',
                      padding: '12px',
                      backgroundColor: event.status === 'cancelled' ? 'rgba(148,163,184,0.1)' : token ? colors.accent : 'transparent',
                      color: event.status === 'cancelled' ? colors.textMuted : token ? '#fff' : colors.accent,
                      border: event.status === 'cancelled' ? `1px solid ${colors.border}` : token ? 'none' : `1px solid ${colors.accent}`,
                      borderRadius: '10px',
                      fontSize: '14px',
                      fontWeight: '700',
                      cursor: event.status === 'cancelled' ? 'not-allowed' : 'pointer',
                      boxShadow: token && event.status !== 'cancelled' ? '0 4px 14px rgba(99,102,241,0.4)' : 'none',
                      transition: 'all 0.2s ease'
                    }}
                  >
                    {event.status === 'cancelled' ? 'Event Cancelled' : token ? '✅ RSVP Now' : 'Sign in to RSVP'}
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
