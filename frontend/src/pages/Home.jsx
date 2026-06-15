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
}

export default function Home() {
  const [events, setEvents] = useState([])
  const [loading, setLoading] = useState(true)
  const token = localStorage.getItem("token")

  useEffect(() => {
    fetch("http://localhost:8000/api/events")
      .then(r => r.json())
      .then(data => { setEvents(data); setLoading(false) })
      .catch(() => setLoading(false))
  }, [])

  return (
    <div style={{ backgroundColor: colors.bgDark, minHeight: '100vh', fontFamily: "'Inter', sans-serif" }}>

      {/* HERO */}
      <div style={{ textAlign: 'center', padding: '80px 20px 60px', background: 'linear-gradient(180deg, #1a162e 0%, #0f0c1b 100%)' }}>
        <h1 style={{ fontSize: '48px', fontWeight: '800', color: colors.textMain, margin: '0 0 16px 0', letterSpacing: '-1px' }}>
          Welcome to <span style={{ color: colors.accent }}>EventHub</span>
        </h1>
        <p style={{ fontSize: '18px', color: colors.textMuted, marginBottom: '32px', maxWidth: '500px', margin: '0 auto 32px' }}>
          Discover and join internal company events. From lunch-and-learns to game nights — all in one place.
        </p>
        {!token && (
          <div style={{ display: 'flex', gap: '16px', justifyContent: 'center' }}>
            <Link to="/register" style={{ padding: '13px 28px', backgroundColor: colors.accent, color: '#fff', borderRadius: '8px', textDecoration: 'none', fontSize: '15px', fontWeight: '600' }}>
              Get Started
            </Link>
            <Link to="/login" style={{ padding: '13px 28px', backgroundColor: 'transparent', color: colors.textMain, borderRadius: '8px', textDecoration: 'none', fontSize: '15px', fontWeight: '600', border: `1px solid ${colors.border}` }}>
              Sign In
            </Link>
          </div>
        )}
      </div>

      {/* EVENTS */}
      <div style={{ maxWidth: '1100px', margin: '0 auto', padding: '0 20px 60px' }}>
        <h2 style={{ color: colors.textMain, fontSize: '24px', fontWeight: '700', marginBottom: '24px' }}>
          Upcoming Events
        </h2>

        {loading ? (
          <p style={{ color: colors.textMuted }}>Loading events...</p>
        ) : events.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '60px', backgroundColor: colors.cardBg, borderRadius: '16px', border: `1px solid ${colors.border}` }}>
            <p style={{ fontSize: '32px', marginBottom: '12px' }}>📅</p>
            <p style={{ color: colors.textMuted, fontSize: '16px' }}>No upcoming events yet. Check back soon!</p>
          </div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '24px' }}>
            {events.map(event => (
              <div key={event.id} style={{ backgroundColor: colors.cardBg, borderRadius: '16px', overflow: 'hidden', border: `1px solid ${colors.border}` }}>
                {event.banner_url ? (
                  <img src={event.banner_url} alt="Banner" style={{ width: '100%', height: '180px', objectFit: 'cover' }} />
                ) : (
                  <div style={{ width: '100%', height: '180px', backgroundColor: colors.inputBg, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '40px' }}>
                    📅
                  </div>
                )}
                <div style={{ padding: '20px' }}>
                  <h3 style={{ color: colors.textMain, fontSize: '18px', fontWeight: '700', margin: '0 0 8px' }}>{event.title}</h3>
                  <p style={{ color: colors.textMuted, fontSize: '13px', margin: '0 0 4px' }}>📍 {event.location}</p>
                  <p style={{ color: colors.textMuted, fontSize: '13px', margin: '0 0 16px' }}>
                    📅 {event.date ? new Date(event.date).toLocaleString('en-US', { dateStyle: 'medium', timeStyle: 'short' }) : ''}
                  </p>
                  <p style={{ color: colors.textMuted, fontSize: '14px', margin: '0 0 20px', lineHeight: '1.5' }}>{event.description}</p>
                  {token ? (
                    <button style={{ width: '100%', padding: '10px', backgroundColor: colors.accent, color: '#fff', border: 'none', borderRadius: '8px', fontSize: '14px', fontWeight: '600', cursor: 'pointer' }}>
                      RSVP Now
                    </button>
                  ) : (
                    <Link to="/login" style={{ display: 'block', textAlign: 'center', padding: '10px', backgroundColor: 'transparent', color: colors.accent, border: `1px solid ${colors.accent}`, borderRadius: '8px', fontSize: '14px', fontWeight: '600', textDecoration: 'none' }}>
                      Sign in to RSVP
                    </Link>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}