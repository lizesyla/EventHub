import { useState, useEffect } from "react"
import { apiUrl } from '../config/api';

const colors = {
  bgDark: '#0f172a', cardBg: '#1e293b', inputBg: '#0f172a',
  textMain: '#ffffff', textMuted: '#94a3b8', accent: '#6366f1',
  border: '#334155', error: '#ef4444', green: '#10b981',
}

export default function Admin({ defaultTab = 'events' }) {
  const [events, setEvents] = useState([])
  const [users, setUsers] = useState([])
  const [loadingEvents, setLoadingEvents] = useState(true)
  const [loadingUsers, setLoadingUsers] = useState(true)
  const [message, setMessage] = useState("")
  const token = localStorage.getItem("token")
  const headers = { Authorization: `Bearer ${token}` }

  useEffect(() => {
    const authHeaders = { Authorization: `Bearer ${token}` }

    fetch(apiUrl("/api/events"), { headers: authHeaders })
      .then(r => r.json())
      .then(data => { setEvents(Array.isArray(data) ? data : []); setLoadingEvents(false) })
      .catch(() => setLoadingEvents(false))

    fetch(apiUrl("/api/admin/users"), { headers: authHeaders })
      .then(r => r.json())
      .then(data => { setUsers(Array.isArray(data) ? data : []); setLoadingUsers(false) })
      .catch(() => setLoadingUsers(false))
  }, [token])

  async function approveEvent(eventId) {
    const res = await fetch(apiUrl(`/api/events/${eventId}/approve`), {
      method: 'PATCH', headers,
    })
    if (res.ok) {
      setEvents(prev => prev.map(e => e.id === eventId ? { ...e, status: 'upcoming' } : e))
      setMessage('Event approved successfully!')
      setTimeout(() => setMessage(''), 3000)
    }
  }

  async function rejectEvent(eventId) {
    if (!window.confirm("Reject this event?")) return
    const res = await fetch(apiUrl(`/api/events/${eventId}/reject`), {
      method: 'PATCH', headers,
    })
    if (res.ok) {
      setEvents(prev => prev.map(e => e.id === eventId ? { ...e, status: 'cancelled' } : e))
      setMessage('Event rejected.')
      setTimeout(() => setMessage(''), 3000)
    }
  }

  async function handleDeleteEvent(eventId) {
    if (!window.confirm("Delete this event permanently?")) return
    const res = await fetch(apiUrl(`/api/events/${eventId}`), {
      method: 'DELETE', headers,
    })
    if (res.ok) {
      setEvents(prev => prev.filter(e => e.id !== eventId))
      setMessage('Event deleted successfully!')
      setTimeout(() => setMessage(''), 3000)
    }
  }

  async function handleCancelEvent(eventId) {
    if (!window.confirm("Cancel this event?")) return
    const res = await fetch(apiUrl(`/api/events/${eventId}/cancel`), {
      method: 'PATCH', headers,
    })
    if (res.ok) {
      setEvents(prev => prev.map(e => e.id === eventId ? { ...e, status: 'cancelled' } : e))
      setMessage('Event cancelled.')
      setTimeout(() => setMessage(''), 3000)
    }
  }

  async function handleActivateUser(userId) {
    const res = await fetch(apiUrl(`/api/admin/users/${userId}/approve`), {
      method: 'PATCH', headers,
    })
    if (res.ok) {
      setUsers(prev => prev.map(u => u.id === userId ? { ...u, is_approved: true } : u))
    }
  }

  async function handleDeactivateUser(userId) {
    if (!window.confirm("Deactivate this user?")) return
    const res = await fetch(apiUrl(`/api/admin/users/${userId}/deactivate`), {
      method: 'PATCH', headers,
    })
    if (res.ok) {
      setUsers(prev => prev.map(u => u.id === userId ? { ...u, is_approved: false } : u))
    }
  }

  const eventStatusLabel = (status) => {
    if (status === 'pending') return 'Pending'
    if (status === 'cancelled') return 'Cancelled'
    if (status === 'past') return 'Archived'
    return 'Active'
  }

  const eventStatusColor = (status) => {
    if (status === 'pending') return { bg: 'rgba(245,158,11,0.15)', color: '#f59e0b' }
    if (status === 'cancelled') return { bg: 'rgba(239,68,68,0.15)', color: '#ef4444' }
    if (status === 'past') return { bg: 'rgba(148,163,184,0.15)', color: '#94a3b8' }
    return { bg: 'rgba(16,185,129,0.15)', color: '#10b981' }
  }

  const roleColor = (role) => {
    if (role === 'admin') return { bg: 'rgba(239,68,68,0.15)', color: '#ef4444', border: '#ef4444' }
    return { bg: 'rgba(99,102,241,0.15)', color: '#6366f1', border: '#6366f1' }
  }

  const roleIcon = (role) => role === 'admin' ? 'Admin' : 'Attendee'

  return (
    <div style={{ backgroundColor: colors.bgDark, minHeight: '100vh', padding: '40px 20px', fontFamily: "'Inter', sans-serif" }}>
      <div style={{ maxWidth: '1200px', margin: '0 auto' }}>

        <div style={{ marginBottom: '32px' }}>
          <p style={{ color: colors.accent, fontSize: '12px', fontWeight: '700', letterSpacing: '3px', textTransform: 'uppercase', margin: '0 0 10px' }}>ADMIN</p>
          <h2 style={{ fontSize: '32px', fontWeight: '800', color: colors.textMain, margin: '0 0 8px', letterSpacing: '-1px' }}>
            {defaultTab === 'events' ? 'All Events' : 'Users'}
          </h2>
          <p style={{ color: colors.textMuted, fontSize: '15px', margin: 0 }}>
            {defaultTab === 'events' ? 'Oversee and approve events' : 'Manage all user accounts'}
          </p>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '16px', marginBottom: '40px' }}>
          {[
            { label: 'Total Events', value: events.length, icon: '📅', color: colors.accent },
            { label: 'Pending Review', value: events.filter(e => e.status === 'pending').length, icon: '⏳', color: '#f59e0b' },
            { label: 'Active Events', value: events.filter(e => e.status === 'upcoming').length, icon: '✅', color: '#10b981' },
            { label: 'Total Users', value: users.length, icon: '👥', color: '#06b6d4' },
          ].map((stat, i) => (
            <div key={i} style={{ backgroundColor: colors.cardBg, padding: '20px', borderRadius: '16px', border: `1px solid ${colors.border}`, textAlign: 'center' }}>
              <p style={{ fontSize: '28px', margin: '0 0 6px' }}>{stat.icon}</p>
              <p style={{ fontSize: '26px', fontWeight: '800', color: stat.color, margin: '0 0 4px' }}>{stat.value}</p>
              <p style={{ fontSize: '12px', color: colors.textMuted, margin: 0 }}>{stat.label}</p>
            </div>
          ))}
        </div>

        {message && (
          <div style={{ padding: '14px 16px', backgroundColor: 'rgba(16,185,129,0.1)', border: '1px solid rgba(16,185,129,0.3)', borderRadius: '10px', color: colors.green, fontSize: '14px', fontWeight: '600', marginBottom: '24px' }}>
            {message}
          </div>
        )}

        {defaultTab === 'events' && (
          <div>
            {loadingEvents ? (
              <p style={{ color: colors.textMuted }}>Loading...</p>
            ) : events.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '60px', backgroundColor: colors.cardBg, borderRadius: '16px', border: `1px solid ${colors.border}` }}>
                <p style={{ color: colors.textMuted }}>No events found.</p>
              </div>
            ) : (
              <div style={{ backgroundColor: colors.cardBg, borderRadius: '12px', border: `1px solid ${colors.border}`, overflow: 'hidden' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                  <thead>
                    <tr style={{ borderBottom: `1px solid ${colors.border}` }}>
                      {['Event', 'Location', 'Date', 'Status', 'Actions'].map(header => (
                        <th key={header} style={{ padding: '16px', textAlign: 'left', fontSize: '13px', fontWeight: '700', color: colors.textMuted }}>{header}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {events.map(event => {
                      const sc = eventStatusColor(event.status)
                      return (
                        <tr key={event.id} style={{ borderBottom: `1px solid ${colors.border}` }}>
                          <td style={{ padding: '16px', color: colors.textMain, fontSize: '14px', fontWeight: '600' }}>{event.title}</td>
                          <td style={{ padding: '16px', color: colors.textMuted, fontSize: '14px' }}>{event.location}</td>
                          <td style={{ padding: '16px', color: colors.textMuted, fontSize: '14px' }}>
                            {event.date_time ? new Date(event.date_time).toLocaleDateString('en-US') : '—'}
                          </td>
                          <td style={{ padding: '16px' }}>
                            <span style={{ fontSize: '12px', padding: '3px 10px', borderRadius: '12px', backgroundColor: sc.bg, color: sc.color, fontWeight: '600' }}>
                              {eventStatusLabel(event.status)}
                            </span>
                          </td>
                          <td style={{ padding: '16px' }}>
                            <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                              {event.status === 'pending' && (
                                <>
                                  <button onClick={() => approveEvent(event.id)} style={{ padding: '6px 12px', backgroundColor: 'rgba(16,185,129,0.15)', color: colors.green, border: '1px solid rgba(16,185,129,0.3)', borderRadius: '6px', fontSize: '12px', fontWeight: '600', cursor: 'pointer' }}>
                                    Approve
                                  </button>
                                  <button onClick={() => rejectEvent(event.id)} style={{ padding: '6px 12px', backgroundColor: 'transparent', color: colors.error, border: `1px solid ${colors.error}`, borderRadius: '6px', fontSize: '12px', fontWeight: '600', cursor: 'pointer' }}>
                                    Reject
                                  </button>
                                </>
                              )}
                              <button onClick={() => handleDeleteEvent(event.id)} style={{ padding: '6px 12px', backgroundColor: 'transparent', color: colors.error, border: `1px solid ${colors.error}`, borderRadius: '6px', fontSize: '12px', fontWeight: '600', cursor: 'pointer' }}>
                                Delete
                              </button>
                              {event.status === 'upcoming' && (
                                <button onClick={() => handleCancelEvent(event.id)} style={{ padding: '6px 12px', backgroundColor: 'transparent', color: '#f59e0b', border: '1px solid #f59e0b', borderRadius: '6px', fontSize: '12px', fontWeight: '600', cursor: 'pointer' }}>
                                  Cancel
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
                      return (
                        <tr key={user.id} style={{ borderBottom: `1px solid ${colors.border}` }}>
                          <td style={{ padding: '16px' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                              <div style={{ width: '36px', height: '36px', borderRadius: '50%', backgroundColor: colors.accent + '22', border: `1px solid ${colors.accent}44`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '14px', fontWeight: '700', color: colors.accent, flexShrink: 0 }}>
                                {user.name ? user.name.charAt(0).toUpperCase() : 'U'}
                              </div>
                              <span style={{ color: colors.textMain, fontSize: '14px', fontWeight: '600' }}>{user.name || 'No Name'}</span>
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
                              backgroundColor: user.is_approved ? 'rgba(16,185,129,0.15)' : 'rgba(239,68,68,0.15)',
                              color: user.is_approved ? '#10b981' : '#ef4444',
                            }}>
                              {user.is_approved ? 'Active' : 'Deactivated'}
                            </span>
                          </td>
                          <td style={{ padding: '16px' }}>
                            <div style={{ display: 'flex', gap: '8px' }}>
                              {!user.is_approved && user.role !== 'admin' && (
                                <button onClick={() => handleActivateUser(user.id)} style={{ padding: '6px 12px', backgroundColor: 'rgba(16,185,129,0.15)', color: colors.green, border: '1px solid rgba(16,185,129,0.3)', borderRadius: '6px', fontSize: '12px', fontWeight: '600', cursor: 'pointer' }}>
                                  Activate
                                </button>
                              )}
                              {user.is_approved && user.role !== 'admin' && (
                                <button onClick={() => handleDeactivateUser(user.id)} style={{ padding: '6px 12px', backgroundColor: 'transparent', color: colors.error, border: `1px solid ${colors.error}`, borderRadius: '6px', fontSize: '12px', fontWeight: '600', cursor: 'pointer' }}>
                                  Deactivate
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
