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

  useEffect(() => {
    fetch("http://localhost:8000/api/events")
      .then(r => r.json())
      .then(data => { setEvents(data.slice(0, 3)); setLoading(false) })
      .catch(() => setLoading(false))
  }, [])

  return (
    <div style={{ backgroundColor: colors.bgDark, minHeight: '100vh', fontFamily: "'Inter', sans-serif" }}>

      {/* HERO */}
      <div style={{
        textAlign: 'center',
        padding: '120px 20px 100px',
        background: 'linear-gradient(135deg, #1a162e 0%, #0f0c1b 50%, #1a0f2e 100%)',
        position: 'relative',
        overflow: 'hidden'
      }}>
        <div style={{ position: 'absolute', top: '-100px', right: '-100px', width: '500px', height: '500px', borderRadius: '50%', backgroundColor: colors.accent, opacity: 0.06 }} />
        <div style={{ position: 'absolute', bottom: '-80px', left: '-80px', width: '400px', height: '400px', borderRadius: '50%', backgroundColor: colors.accent, opacity: 0.06 }} />

        <div style={{ display: 'inline-block', padding: '6px 16px', backgroundColor: colors.accent + '22', border: `1px solid ${colors.accent}44`, borderRadius: '20px', marginBottom: '28px' }}>
          <span style={{ color: colors.accent, fontSize: '13px', fontWeight: '600' }}>🎉 Genpact Internal Events Platform</span>
        </div>

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
          </div>

          {loading ? (
            <p style={{ color: colors.textMuted }}>Loading...</p>
          ) : events.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '60px', backgroundColor: colors.bgDark, borderRadius: '16px', border: `1px solid ${colors.border}` }}>
              <p style={{ fontSize: '40px', marginBottom: '12px' }}>📅</p>
              <p style={{ color: colors.textMuted, fontSize: '16px', margin: '0 0 20px' }}>No events yet — be the first to create one!</p>
              <Link to="/register" style={{ padding: '12px 24px', backgroundColor: colors.accent, color: '#fff', borderRadius: '8px', textDecoration: 'none', fontSize: '14px', fontWeight: '600' }}>
                Get Started
              </Link>
            </div>
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '24px' }}>
              {events.map(event => (
                <div key={event.id} style={{ backgroundColor: colors.bgDark, borderRadius: '16px', overflow: 'hidden', border: `1px solid ${colors.border}` }}
                  onMouseEnter={e => e.currentTarget.style.transform = 'translateY(-4px)'}
                  onMouseLeave={e => e.currentTarget.style.transform = 'translateY(0)'}
                >
                  {event.banner_url ? (
                    <img src={event.banner_url} alt="Banner" style={{ width: '100%', height: '180px', objectFit: 'cover' }} />
                  ) : (
                    <div style={{ width: '100%', height: '180px', background: `linear-gradient(135deg, #252142, #2d1f4e)`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '48px' }}>
                      📅
                    </div>
                  )}
                  <div style={{ padding: '20px' }}>
                    <h3 style={{ color: colors.textMain, fontSize: '17px', fontWeight: '700', margin: '0 0 10px' }}>{event.title}</h3>
                    <p style={{ color: colors.textMuted, fontSize: '13px', margin: '0 0 4px' }}>📍 {event.location}</p>
                    <p style={{ color: colors.textMuted, fontSize: '13px', margin: '0 0 16px' }}>
                      🗓️ {event.date ? new Date(event.date).toLocaleString('en-US', { dateStyle: 'medium', timeStyle: 'short' }) : ''}
                    </p>
                    <Link to="/events" style={{ display: 'block', textAlign: 'center', padding: '10px', backgroundColor: colors.accent + '22', color: colors.accent, border: `1px solid ${colors.accent}44`, borderRadius: '8px', fontSize: '14px', fontWeight: '600', textDecoration: 'none' }}>
                      View Event →
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* CTA */}
      <div style={{ textAlign: 'center', padding: '80px 20px', background: 'linear-gradient(135deg, #1a162e 0%, #0f0c1b 100%)' }}>
        <h2 style={{ color: colors.textMain, fontSize: '40px', fontWeight: '800', margin: '0 0 16px', letterSpacing: '-1px' }}>
          Ready to join?
        </h2>
        <p style={{ color: colors.textMuted, fontSize: '16px', marginBottom: '36px' }}>
          Create your account and start RSVPing to events today.
        </p>
        <Link to="/register" style={{
          padding: '16px 40px', backgroundColor: colors.accent, color: '#fff',
          borderRadius: '10px', textDecoration: 'none', fontSize: '16px', fontWeight: '700',
          boxShadow: `0 8px 32px ${colors.accent}55`
        }}>
          Create Account →
        </Link>
      </div>

      {/* FOOTER */}
      <div style={{ borderTop: `1px solid ${colors.border}`, padding: '24px', textAlign: 'center' }}>
        <p style={{ color: colors.textMuted, fontSize: '13px', margin: 0 }}>
          EventHub · Internal Events Platform · Genpact 2026
        </p>
      </div>

    </div>
  )
}