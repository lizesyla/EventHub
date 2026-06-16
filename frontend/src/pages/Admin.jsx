import { useState, useEffect } from "react"

const colors = {
  bgDark: '#0f0c1b', cardBg: '#1a162e', inputBg: '#252142',
  textMain: '#ffffff', textMuted: '#b3b0cd', accent: '#8b5cf6',
  border: '#2d294e', error: '#ef4444', green: '#059669'
}

const mockUsers = [
  { id: 1, name: "Ana Krasniqi", email: "ana@gmail.com", role: "attendee", status: "Active" },
  { id: 2, name: "John Doe", email: "john@company.com", role: "organizer", status: "Active" },
  { id: 3, name: "Sara Berisha", email: "sara@gmail.com", role: "attendee", status: "Active" },
  { id: 4, name: "Admin User", email: "admin@company.com", role: "admin", status: "Active" },
]

export default function Admin({ defaultTab = 'events' }) {
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

  const roleColor = (role) => {
    if (role === 'admin') return { bg: '#ef444433', color: '#ef4444', border: '#ef4444' }
    if (role === 'organizer') return { bg: '#f9731633', color: '#f97316', border: '#f97316' }
    return { bg: '#8b5cf633', color: '#8b5cf6', border: '#8b5cf6' }
  }

  const roleIcon = (role) => {
    if (role === 'admin') return '🛡️'
    if (role === 'organizer') return '🎯'
    return '👤'
  }

  return (
    <div style={{ backgroundColor: colors.bgDark, minHeight: '100vh', padding: '40px 20px', fontFamily: "'Inter', sans-serif" }}>
      <div style={{ maxWidth: '1100px', margin: '0 auto' }}>

        {/* HEADER */}
        <div style={{ marginBottom: '32px' }}>
          <h2 style={{ fontSize: '32px', fontWeight: '700', color: colors.textMain, margin: 0 }}>
            {defaultTab === 'events' ? 'All Events' : 'Users'}
          </h2>
          <p style={{ color: colors.textMuted, fontSize: '15px', marginTop: '8px' }}>
            {defaultTab === 'events' ? 'Oversee all events on the platform' : 'Manage all user accounts'}
          </p>
        </div>

        {/* STATS */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '16px', marginBottom: '32px' }}>
          {[
            { label: 'Total Events', value: events.length, icon: '📅', color: colors.accent },
            { label: 'Active Events', value: events.filter(e => !e.is_archived).length, icon: '✅', color: '#10b981' },
            { label: 'Archived', value: events.filter(e => e.is_archived).length, icon: '📦', color: '#f97316' },
            { label: 'Total Users', value: mockUsers.length, icon: '👥', color: '#06b6d4' },
          ].map((stat, i) => (
            <div key={i} style={{ backgroundColor: colors.cardBg, padding: '20px', borderRadius: '12px', border: `1px solid ${colors.border}`, textAlign: 'center' }}>
              <p style={{ fontSize: '28px', margin: '0 0 6px' }}>{stat.icon}</p>
              <p style={{ fontSize: '26px', fontWeight: '700', color: stat.color, margin: '0 0 4px' }}>{stat.value}</p>
              <p style={{ fontSize: '12px', color: colors.textMuted, margin: 0 }}>{stat.label}</p>
            </div>
          ))}
        </div>

        {/* ALL EVENTS */}
        {defaultTab === 'events' && (
          <div>
            {loading ? (
              <p style={{ color: colors.textMuted }}>Loading...</p>
            ) : events.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '60px', backgroundColor: colors.cardBg, borderRadius: '16px', border: `1px solid ${colors.border}` }}>
                <p style={{ fontSize: '40px', marginBottom: '12px' }}>📅</p>
                <p style={{ color: colors.textMuted }}>No events found.</p>
              </div>
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
        )}

        {/* USERS */}
        {defaultTab === 'users' && (
          <div>
            <div style={{ backgroundColor: colors.cardBg, borderRadius: '16px', border: `1px solid ${colors.border}`, overflow: 'hidden' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr style={{ borderBottom: `1px solid ${colors.border}` }}>
                    {['User', 'Email', 'Role', 'Status', 'Actions'].map(h => (
                      <th key={h} style={{ padding: '16px', textAlign: 'left', fontSize: '13px', fontWeight: '600', color: colors.textMuted }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {mockUsers.map(user => {
                    const rc = roleColor(user.role)
                    return (
                      <tr key={user.id} style={{ borderBottom: `1px solid ${colors.border}` }}>
                        <td style={{ padding: '16px' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                            <div style={{ width: '36px', height: '36px', borderRadius: '50%', backgroundColor: colors.accent + '33', border: `1px solid ${colors.accent}`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '14px', fontWeight: '700', color: colors.accent, flexShrink: 0 }}>
                              {user.name.charAt(0).toUpperCase()}
                            </div>
                            <span style={{ color: colors.textMain, fontSize: '14px', fontWeight: '600' }}>{user.name}</span>
                          </div>
                        </td>
                        <td style={{ padding: '16px', color: colors.textMuted, fontSize: '14px' }}>{user.email}</td>
                        <td style={{ padding: '16px' }}>
                          <span style={{ fontSize: '12px', padding: '3px 10px', borderRadius: '12px', backgroundColor: rc.bg, color: rc.color, border: `1px solid ${rc.border}`, fontWeight: '600' }}>
                            {roleIcon(user.role)} {user.role}
                          </span>
                        </td>
                        <td style={{ padding: '16px' }}>
                          <span style={{ fontSize: '12px', padding: '3px 10px', borderRadius: '12px', backgroundColor: '#05966933', color: '#10b981', fontWeight: '600' }}>
                            {user.status}
                          </span>
                        </td>
                        <td style={{ padding: '16px' }}>
                          <button style={{ padding: '6px 12px', backgroundColor: 'transparent', color: colors.error, border: `1px solid ${colors.error}`, borderRadius: '6px', fontSize: '12px', fontWeight: '600', cursor: 'pointer' }}>
                            Deactivate
                          </button>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
            <p style={{ color: colors.textMuted, fontSize: '12px', marginTop: '12px' }}>
              ⚠️ User data will be connected to backend in Sprint 3.
            </p>
          </div>
        )}

      </div>
    </div>
  )
}