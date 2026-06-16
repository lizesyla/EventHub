import { useState, useEffect } from "react"


const colors = {
  bgDark: '#0f0c1b', cardBg: '#1a162e', inputBg: '#252142',
  textMain: '#ffffff', textMuted: '#b3b0cd', accent: '#8b5cf6',
  border: '#2d294e', error: '#ef4444'
}

export default function Admin() {
  const [events, setEvents] = useState([])
  const [loading, setLoading] = useState(true)
  const token = localStorage.getItem("token")
  const headers = { "Authorization": `Bearer ${token}` }

  useEffect(() => {
    fetch("http://localhost:8000/api/events", { headers })
      .then(r => r.json())
      .then(data => { setEvents(data); setLoading(false) })
      .catch(() => setLoading(false))
  }, [])

  return (
    <div style={{ backgroundColor: colors.bgDark, minHeight: '100vh', padding: '40px 20px', fontFamily: "'Inter', sans-serif" }}>
      <div style={{ maxWidth: '1100px', margin: '0 auto' }}>

        {/* HEADER */}
        <div style={{ marginBottom: '32px' }}>
          <h2 style={{ fontSize: '32px', fontWeight: '700', color: colors.textMain, margin: 0 }}>Admin Panel</h2>
          <p style={{ color: colors.textMuted, fontSize: '15px', marginTop: '8px' }}>Oversee all events and user accounts</p>
        </div>

        {/* STATS */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '16px', marginBottom: '32px' }}>
          {[
            { label: 'Total Events', value: events.length, icon: '📅', color: colors.accent },
            { label: 'Active Events', value: events.filter(e => !e.is_archived).length, icon: '✅', color: '#10b981' },
            { label: 'Archived Events', value: events.filter(e => e.is_archived).length, icon: '📦', color: '#f97316' },
          ].map((stat, i) => (
            <div key={i} style={{ backgroundColor: colors.cardBg, padding: '24px', borderRadius: '12px', border: `1px solid ${colors.border}`, textAlign: 'center' }}>
              <p style={{ fontSize: '32px', margin: '0 0 8px' }}>{stat.icon}</p>
              <p style={{ fontSize: '28px', fontWeight: '700', color: stat.color, margin: '0 0 4px' }}>{stat.value}</p>
              <p style={{ fontSize: '13px', color: colors.textMuted, margin: 0 }}>{stat.label}</p>
            </div>
          ))}
        </div>

        {/* ALL EVENTS */}
        <h3 style={{ color: colors.textMain, fontSize: '20px', fontWeight: '700', marginBottom: '20px' }}>All Events</h3>

        {loading ? (
          <p style={{ color: colors.textMuted }}>Loading...</p>
        ) : (
          <div style={{ backgroundColor: colors.cardBg, borderRadius: '16px', border: `1px solid ${colors.border}`, overflow: 'hidden' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ borderBottom: `1px solid ${colors.border}` }}>
                  {['Title', 'Location', 'Date', 'Status', 'Actions'].map(h => (
                    <th key={h} style={{ padding: '16px', textAlign: 'left', fontSize: '13px', fontWeight: '600', color: colors.textMuted }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {events.map(event => (
                  <tr key={event.id} style={{ borderBottom: `1px solid ${colors.border}` }}>
                    <td style={{ padding: '16px', color: colors.textMain, fontSize: '14px', fontWeight: '600' }}>{event.title}</td>
                    <td style={{ padding: '16px', color: colors.textMuted, fontSize: '14px' }}>{event.location}</td>
                    <td style={{ padding: '16px', color: colors.textMuted, fontSize: '14px' }}>
                      {event.date ? new Date(event.date).toLocaleDateString('en-US') : ''}
                    </td>
                    <td style={{ padding: '16px' }}>
                      <span style={{ fontSize: '12px', padding: '3px 10px', borderRadius: '12px', backgroundColor: event.is_archived ? '#37415133' : '#05966933', color: event.is_archived ? '#9ca3af' : '#10b981', fontWeight: '600' }}>
                        {event.is_archived ? 'Archived' : 'Active'}
                      </span>
                    </td>
                    <td style={{ padding: '16px' }}>
                      <button style={{ padding: '6px 12px', backgroundColor: 'transparent', color: colors.error, border: `1px solid ${colors.error}`, borderRadius: '6px', fontSize: '12px', fontWeight: '600', cursor: 'pointer' }}>
                        Delete
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}