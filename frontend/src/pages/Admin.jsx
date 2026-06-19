import { useState, useEffect } from "react"

const colors = {
  bgDark: '#0f172a', cardBg: '#1e293b', inputBg: '#0f172a',
  textMain: '#ffffff', textMuted: '#94a3b8', accent: '#6366f1',
  border: '#334155', error: '#ef4444', green: '#10b981'
}

export default function Admin({ defaultTab = 'events' }) {
  const [events, setEvents] = useState([])
  const [users, setUsers] = useState([])
  const [loadingEvents, setLoadingEvents] = useState(true)
  const [loadingUsers, setLoadingUsers] = useState(true)
  const token = localStorage.getItem("token")
  const headers = { "Authorization": `Bearer ${token}` }

  useEffect(() => {
    fetch("http://localhost:8000/api/events", { headers })
      .then(r => r.json())
      .then(data => { setEvents(Array.isArray(data) ? data : []); setLoadingEvents(false) })
      .catch(() => setLoadingEvents(false))

    fetch("http://localhost:8000/api/admin/users", { headers })
      .then(r => r.json())
      .then(data => { setUsers(Array.isArray(data) ? data : []); setLoadingUsers(false) })
      .catch(() => setLoadingUsers(false))
  }, [])

  async function handleApprove(userId) {
    const res = await fetch(`http://localhost:8000/api/admin/users/${userId}/approve`, {
      method: 'PATCH',
      headers
    })
    if (res.ok) {
      setUsers(prev => prev.map(u =>
        u.id === userId ? { ...u, is_approved: true } : u
      ))
    }
  }

  async function handleDeactivate(userId) {
    if (!window.confirm("Are you sure you want to deactivate this user?")) return
    const res = await fetch(`http://localhost:8000/api/admin/users/${userId}/deactivate`, {
      method: 'PATCH',
      headers
    })
    if (res.ok) {
      setUsers(prev => prev.map(u =>
        u.id === userId ? { ...u, is_approved: false } : u
      ))
    }
  }

  const roleColor = (role) => {
    if (role === 'admin') return { bg: 'rgba(239,68,68,0.15)', color: '#ef4444', border: '#ef4444' }
    if (role === 'organizer') return { bg: 'rgba(245,158,11,0.15)', color: '#f59e0b', border: '#f59e0b' }
    return { bg: 'rgba(99,102,241,0.15)', color: '#6366f1', border: '#6366f1' }
  }

  const roleIcon = (role) => {
    if (role === 'admin') return '🛡️'
    if (role === 'organizer') return '🎯'
    return '👤'
  }

  return (
    <div style={{ backgroundColor: colors.bgDark, minHeight: '100vh', padding: '40px 20px', fontFamily: "'Inter', sans-serif" }}>
      <div style={{ maxWidth: '1200px', margin: '0 auto' }}>

        {/* HEADER */}
        <div style={{ marginBottom: '32px' }}>
          <p style={{ color: colors.accent, fontSize: '12px', fontWeight: '700', letterSpacing: '3px', textTransform: 'uppercase', margin: '0 0 10px' }}>ADMIN</p>
          <h2 style={{ fontSize: '32px', fontWeight: '800', color: colors.textMain, margin: '0 0 8px', letterSpacing: '-1px' }}>
            {defaultTab === 'events' ? 'All Events' : 'Users'}
          </h2>
          <p style={{ color: colors.textMuted, fontSize: '15px', margin: 0 }}>
            {defaultTab === 'events' ? 'Oversee all events on the platform' : 'Manage all user accounts'}
          </p>
        </div>

        {/* STATS */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '16px', marginBottom: '40px' }}>
          {[
            { label: 'Total Events', value: events.length, icon: '📅', color: colors.accent },
            { label: 'Active Events', value: events.filter(e => e.status === 'upcoming').length, icon: '✅', color: '#10b981' },
            { label: 'Total Users', value: users.length, icon: '👥', color: '#06b6d4' },
            { label: 'Pending Approval', value: users.filter(u => u.role === 'organizer' && !u.is_approved).length, icon: '⏳', color: '#f59e0b' },
          ].map((stat, i) => (
            <div key={i} style={{ backgroundColor: colors.cardBg, padding: '20px', borderRadius: '16px', border: `1px solid ${colors.border}`, textAlign: 'center' }}>
              <p style={{ fontSize: '28px', margin: '0 0 6px' }}>{stat.icon}</p>
              <p style={{ fontSize: '26px', fontWeight: '800', color: stat.color, margin: '0 0 4px' }}>{stat.value}</p>
              <p style={{ fontSize: '12px', color: colors.textMuted, margin: 0 }}>{stat.label}</p>
            </div>
          ))}
        </div>

        {/* ALL EVENTS */}
        {defaultTab === 'events' && (
          <div>
            {loadingEvents ? (
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
                          {event.date_time ? new Date(event.date_time).toLocaleDateString('en-US') : ''}
                        </td>
                        <td style={{ padding: '16px' }}>
                          <span style={{ fontSize: '12px', padding: '3px 10px', borderRadius: '12px', backgroundColor: event.status === 'upcoming' ? 'rgba(16,185,129,0.15)' : 'rgba(148,163,184,0.15)', color: event.status === 'upcoming' ? '#10b981' : '#94a3b8', fontWeight: '600' }}>
                            {event.status || 'upcoming'}
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
            {loadingUsers ? (
              <p style={{ color: colors.textMuted }}>Loading users...</p>
            ) : users.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '60px', backgroundColor: colors.cardBg, borderRadius: '16px', border: `1px solid ${colors.border}` }}>
                <p style={{ fontSize: '40px', marginBottom: '12px' }}>👥</p>
                <p style={{ color: colors.textMuted }}>No users found.</p>
              </div>
            ) : (
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
                    {users.map(user => {
                      const rc = roleColor(user.role)
                      const isPending = user.role === 'organizer' && !user.is_approved
                      return (
                        <tr key={user.id} style={{ borderBottom: `1px solid ${colors.border}` }}>
                          <td style={{ padding: '16px' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                              <div style={{ width: '36px', height: '36px', borderRadius: '50%', backgroundColor: colors.accent + '22', border: `1px solid ${colors.accent}44`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '14px', fontWeight: '700', color: colors.accent, flexShrink: 0 }}>
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
                            <span style={{ fontSize: '12px', padding: '3px 10px', borderRadius: '12px', fontWeight: '600',
                              backgroundColor: isPending ? 'rgba(245,158,11,0.15)' : user.is_approved ? 'rgba(16,185,129,0.15)' : 'rgba(239,68,68,0.15)',
                              color: isPending ? '#f59e0b' : user.is_approved ? '#10b981' : '#ef4444'
                            }}>
                              {isPending ? '⏳ Pending' : user.is_approved ? '✅ Active' : '❌ Deactivated'}
                            </span>
                          </td>
                          <td style={{ padding: '16px' }}>
                            <div style={{ display: 'flex', gap: '8px' }}>
                              {/* Approve — vetëm nëse nuk është aprovuar dhe jo admin */}
                              {!user.is_approved && user.role !== 'admin' && (
                                <button
                                  onClick={() => handleApprove(user.id)}
                                  style={{ padding: '6px 12px', backgroundColor: 'rgba(16,185,129,0.15)', color: '#10b981', border: '1px solid rgba(16,185,129,0.3)', borderRadius: '6px', fontSize: '12px', fontWeight: '600', cursor: 'pointer' }}>
                                  ✅ Approve
                                </button>
                              )}
                              {/* Deactivate — vetëm nëse është aktiv dhe jo admin */}
                              {user.is_approved && user.role !== 'admin' && (
                                <button
                                  onClick={() => handleDeactivate(user.id)}
                                  style={{ padding: '6px 12px', backgroundColor: 'transparent', color: colors.error, border: `1px solid ${colors.error}`, borderRadius: '6px', fontSize: '12px', fontWeight: '600', cursor: 'pointer' }}>
                                  ❌ Deactivate
                                </button>
                              )}
                            </div>
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

      </div>
    </div>
  )
}