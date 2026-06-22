import { useState, useEffect } from "react"
import { Link } from "react-router-dom"
import { LayoutDashboard, Calendar, Users, Archive, LogOut, CheckCircle2, XCircle, Clock, PackageCheck, UserCheck, UserX, Trash2, Ban, User, Shield } from "lucide-react"
import { BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts"
import jsPDF from "jspdf"
import autoTable from "jspdf-autotable"
import NotificationBell from './NotificationBell'
import ConfirmModal from "../components/ConfirmModal"

const colors = {
  bgDark: '#0f172a', cardBg: '#1e293b', inputBg: '#0f172a',
  textMain: '#ffffff', textMuted: '#94a3b8', accent: '#6366f1',
  border: '#334155', error: '#ef4444', green: '#10b981',
}

const lightColors = {
  bgDark: '#fdf2f8', cardBg: '#ffffff', inputBg: '#fdf2f8',
  textMain: '#1e1b2e', textMuted: '#6b6478', accent: '#ec4899',
  accentSecondary: '#a855f7', border: '#f3e8f5', error: '#ef4444', green: '#10b981'
}
function ProgressCircle({ value, max, label, color, colors, percent: percentOverride }) {
  const percent = percentOverride !== undefined ? Math.min(percentOverride, 100) : (max > 0 ? Math.min((value / max) * 100, 100) : 0)
  const radius = 36
  const circumference = 2 * Math.PI * radius
  const offset = circumference - (percent / 100) * circumference

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '10px' }}>
      <div style={{ position: 'relative', width: '88px', height: '88px' }}>
        <svg width="88" height="88" viewBox="0 0 88 88">
          <circle cx="44" cy="44" r={radius} fill="none" stroke={colors.border} strokeWidth="7" />
          <circle
            cx="44" cy="44" r={radius} fill="none"
            stroke={color} strokeWidth="7"
            strokeDasharray={circumference}
            strokeDashoffset={offset}
            strokeLinecap="round"
            transform="rotate(-90 44 44)"
            style={{ transition: 'stroke-dashoffset 0.6s ease' }}
          />
        </svg>
        <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <span style={{ color: colors.textMain, fontSize: '16px', fontWeight: '800' }}>{value}</span>
        </div>
      </div>
      <p style={{ color: colors.textMuted, fontSize: '12px', margin: 0, textAlign: 'center' }}>{label}</p>
    </div>
  )
}
export default function Admin() {
  const [activePage, setActivePage] = useState('dashboard')
  const [isDarkMode, setIsDarkMode] = useState(true)
  const colors = isDarkMode ? darkColors : lightColors
  const [events, setEvents] = useState([])
  const [history, setHistory] = useState([])
  const [users, setUsers] = useState([])
  const [loadingEvents, setLoadingEvents] = useState(true)
  const [loadingHistory, setLoadingHistory] = useState(true)
  const [loadingUsers, setLoadingUsers] = useState(true)
  const [message, setMessage] = useState("")
  const [stats, setStats] = useState({ turnout: [], popular_events: [] })
  const [trends, setTrends] = useState([])
  const [confirmAction, setConfirmAction] = useState(null)
  const token = localStorage.getItem("token")
  const headers = { Authorization: `Bearer ${token}` }

  useEffect(() => {
    const authHeaders = { Authorization: `Bearer ${token}` }

    fetch("http://localhost:8000/api/events", { headers: authHeaders })
      .then(r => r.json())
      .then(data => { setEvents(Array.isArray(data) ? data : []); setLoadingEvents(false) })
      .catch(() => setLoadingEvents(false))

    fetch("http://localhost:8000/api/admin/users", { headers: authHeaders })
      .then(r => r.json())
      .then(data => { setUsers(Array.isArray(data) ? data : []); setLoadingUsers(false) })
      .catch(() => setLoadingUsers(false))
  }, [token])

  async function approveEvent(eventId) {
    const res = await fetch(`http://localhost:8000/api/events/${eventId}/approve`, {
      method: 'PATCH', headers,
    })
    if (res.ok) {
      setEvents(prev => prev.map(e => e.id === eventId ? { ...e, status: 'upcoming' } : e))
      setMessage('Event approved successfully!')
      setTimeout(() => setMessage(''), 3000)
    }
  }

  async function rejectEvent(eventId) {
    const res = await fetch(`http://localhost:8000/api/events/${eventId}/reject`, {
      method: 'PATCH', headers,
    })
    if (res.ok) {
      const rejected = events.find(e => e.id === eventId)
      setEvents(prev => prev.filter(e => e.id !== eventId))
      if (rejected) setHistory(prev => [{ ...rejected, status: 'cancelled' }, ...prev])
      setMessage('Event rejected.')
      setTimeout(() => setMessage(''), 3000)
    }
  }

  async function cancelEvent(eventId) {
    const res = await fetch(`http://localhost:8000/api/events/${eventId}/cancel`, {
      method: 'PATCH', headers
    })
    if (res.ok) {
      const cancelled = events.find(e => e.id === eventId)
      setEvents(prev => prev.filter(e => e.id !== eventId))
      if (cancelled) setHistory(prev => [{ ...cancelled, status: 'cancelled' }, ...prev])
      setMessage('Event cancelled.')
      setTimeout(() => setMessage(''), 3000)
    }
  }

  async function deleteEvent(eventId, fromHistory) {
    const res = await fetch(`http://localhost:8000/api/events/${eventId}`, {
      method: 'DELETE', headers,
    })
    if (res.ok) {
      if (fromHistory) {
        setHistory(prev => prev.filter(e => e.id !== eventId))
      } else {
        setEvents(prev => prev.filter(e => e.id !== eventId))
      }
      setMessage('Event deleted successfully!')
      setTimeout(() => setMessage(''), 3000)
    }
  }

  async function handleCancelEvent(eventId) {
    if (!window.confirm("Cancel this event?")) return
    const res = await fetch(`http://localhost:8000/api/events/${eventId}/cancel`, {
      method: 'PATCH', headers,
    })
    if (res.ok) {
      setEvents(prev => prev.map(e => e.id === eventId ? { ...e, status: 'cancelled' } : e))
      setMessage('Event cancelled.')
      setTimeout(() => setMessage(''), 3000)
    }
  }

  async function handleActivateUser(userId) {
    const res = await fetch(`http://localhost:8000/api/admin/users/${userId}/approve`, {
      method: 'PATCH', headers,
    })
    if (res.ok) {
      setUsers(prev => prev.map(u => u.id === userId ? { ...u, is_approved: true } : u))
    }
  }

function exportPDF() {
  const doc = new jsPDF()

  doc.setFontSize(18)
  doc.text("EventHub — Admin Report", 14, 18)
  doc.setFontSize(11)
  doc.setTextColor(120)
  doc.text(`Generated on ${new Date().toLocaleDateString()}`, 14, 25)

  doc.setTextColor(0)
  doc.setFontSize(13)
  doc.text("Turnout per Event", 14, 38)

  autoTable(doc, {
    startY: 42,
    head: [["Event", "Reservations", "Capacity"]],
    body: stats.turnout.map(e => [e.title, e.going, e.capacity || "—"]),
    theme: "striped",
    headStyles: { fillColor: [236, 72, 153] }
  })

  const afterTurnoutY = doc.lastAutoTable.finalY + 12
  doc.setFontSize(13)
  doc.text("Top 5 Most Popular Events", 14, afterTurnoutY)

  autoTable(doc, {
    startY: afterTurnoutY + 4,
    head: [["Rank", "Event", "Reservations", "Capacity"]],
    body: stats.popular_events.map((e, i) => [i + 1, e.title, e.going, e.capacity || "—"]),
    theme: "striped",
    headStyles: { fillColor: [168, 85, 247] }
  })

  const afterPopularY = doc.lastAutoTable.finalY + 12
  doc.setFontSize(13)
  doc.text("Reservation Trends Over Time", 14, afterPopularY)

  autoTable(doc, {
    startY: afterPopularY + 4,
    head: [["Date", "Reservations"]],
    body: trends.map(t => [t.date, t.count]),
    theme: "striped",
    headStyles: { fillColor: [236, 72, 153] }
  })

  doc.save(`eventhub-report-${new Date().toISOString().slice(0, 10)}.pdf`)
}

  async function handleDeactivate(userId) {
    const res = await fetch(`http://localhost:8000/api/admin/users/${userId}/deactivate`, {
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

  const totalEvents = events.length + history.length
  const totalGoing = stats.turnout.reduce((sum, e) => sum + e.going, 0)
const totalCapacity = stats.turnout.reduce((sum, e) => sum + e.capacity, 0)
const fullyBookedCount = stats.turnout.filter(e => e.capacity > 0 && e.going >= e.capacity).length
const pendingReviewCount = events.filter(e => e.status === 'pending').length

  const pageInfo = {
    dashboard: { title: 'Dashboard', subtitle: 'Overview of platform activity' },
    events: { title: 'All Events', subtitle: 'Oversee and moderate upcoming events' },
    users: { title: 'Users', subtitle: 'Manage all user accounts' },
    history: { title: 'History', subtitle: 'Past and cancelled events' },
  }

  const roleIcon = (role) => role === 'admin' ? 'Admin' : 'Attendee'

  return (
    <div style={{ backgroundColor: colors.bgDark, minHeight: '100vh', fontFamily: "'Inter', sans-serif", display: 'flex' }}>

      {/* SIDEBAR */}
      <div style={{
        width: '240px',
        background: isDarkMode
          ? `linear-gradient(180deg, ${colors.cardBg} 0%, #1a0f28 100%)`
          : `linear-gradient(180deg, #fdf2f8 0%, #fce7f3 100%)`,
        borderRight: `1px solid ${colors.border}`,
        padding: '28px 16px',
        display: 'flex',
        flexDirection: 'column',
        minHeight: '100vh',
        position: 'sticky',
        top: 0
      }}>
        <div style={{ marginBottom: '32px', paddingLeft: '8px', display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
          <div>
            <h2 style={{ color: colors.textMain, fontSize: '18px', fontWeight: '800', margin: 0 }}>
              Event<span style={{ color: colors.accent }}>Hub</span>
            </h2>
            <p style={{ color: colors.textMuted, fontSize: '12px', margin: '2px 0 0' }}>Admin Panel</p>
          </div>

          <button
            onClick={() => setIsDarkMode(!isDarkMode)}
            style={{
              width: '44px',
              height: '24px',
              borderRadius: '12px',
              border: 'none',
              background: isDarkMode ? `linear-gradient(90deg, ${colors.accent}, ${colors.accentSecondary})` : colors.border,
              position: 'relative',
              cursor: 'pointer',
              padding: 0,
              flexShrink: 0
            }}
          >
            <div style={{
              width: '18px',
              height: '18px',
              borderRadius: '50%',
              backgroundColor: '#fff',
              position: 'absolute',
              top: '3px',
              left: isDarkMode ? '23px' : '3px',
              transition: 'left 0.2s ease'
            }} />
          </button>
        </div>

        <nav style={{ display: 'flex', flexDirection: 'column', gap: '4px', flex: 1 }}>
          {[
            { id: 'dashboard', icon: LayoutDashboard, label: 'Dashboard' },
            { id: 'events', icon: Calendar, label: 'Events' },
            { id: 'users', icon: Users, label: 'Users' },
            { id: 'history', icon: Archive, label: 'History' },
          ].map(item => {
            const Icon = item.icon
            return (
              <button
                key={item.id}
                onClick={() => setActivePage(item.id)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '10px',
                  padding: '10px 12px',
                  borderRadius: '10px',
                  border: 'none',
                  background: activePage === item.id
                    ? `linear-gradient(90deg, ${colors.accent}, ${colors.accentSecondary})`
                    : 'transparent',
                  color: activePage === item.id ? '#ffffff' : colors.textMuted,
                  fontSize: '14px',
                  fontWeight: activePage === item.id ? '700' : '600',
                  cursor: 'pointer',
                  textAlign: 'left',
                  transition: 'all 0.15s',
                  boxShadow: activePage === item.id ? `0 4px 12px ${colors.accent}55` : 'none'
                }}
              >
                <Icon size={16} />
                {item.label}
              </button>
            )
          })}
        </nav>

        <div style={{ borderTop: `1px solid ${colors.border}`, paddingTop: '12px', marginTop: '12px', display: 'flex', flexDirection: 'column', gap: '4px' }}>
          <Link to="/create-event" style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '10px 12px', borderRadius: '8px', color: colors.textMuted, fontSize: '14px', fontWeight: '600', textDecoration: 'none' }}>
            <Calendar size={16} />
            Create Event
          </Link>
          <Link to="/profile" style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '10px 12px', borderRadius: '8px', color: colors.textMuted, fontSize: '14px', fontWeight: '600', textDecoration: 'none' }}>
            <User size={16} />
            Profile
          </Link>
        </div>

        <div style={{ borderTop: `1px solid ${colors.border}`, paddingTop: '16px', marginTop: '16px' }}>
          <button
            onClick={() => {
              localStorage.removeItem('token')
              window.location.href = '/login'
            }}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '10px',
              width: '100%',
              padding: '10px 12px',
              borderRadius: '8px',
              border: 'none',
              backgroundColor: 'transparent',
              color: colors.error,
              fontSize: '14px',
              fontWeight: '600',
              cursor: 'pointer',
              textAlign: 'left'
            }}
          >
            <LogOut size={16} />
            Sign Out
          </button>
        </div>
      </div>

        {message && (
          <div style={{ padding: '14px 16px', backgroundColor: 'rgba(16,185,129,0.1)', border: '1px solid rgba(16,185,129,0.3)', borderRadius: '10px', color: colors.green, fontSize: '14px', fontWeight: '600', marginBottom: '24px' }}>
            {message}
          </div>
          <span style={{ color: colors.textMuted, fontSize: '13px', fontWeight: '600', flexShrink: 0 }}>
            {event.going}{event.capacity > 0 ? ` / ${event.capacity}` : ''}
          </span>
        </div>
      ))}
    </div>
  )}
</div>
<div style={{ backgroundColor: colors.cardBg, borderRadius: '16px', border: `1px solid ${colors.border}`, padding: '24px', marginTop: '24px' }}>
  <h3 style={{ color: colors.textMain, fontSize: '16px', fontWeight: '700', margin: '0 0 20px' }}>
    Reservation Trends Over Time
  </h3>
  {trends.length === 0 ? (
    <p style={{ color: colors.textMuted, textAlign: 'center', padding: '40px' }}>No reservation activity yet.</p>
  ) : (
    <ResponsiveContainer width="100%" height={260}>
      <LineChart data={trends}>
        <CartesianGrid strokeDasharray="3 3" stroke={colors.border} />
        <XAxis dataKey="date" stroke={colors.textMuted} fontSize={11} />
        <YAxis stroke={colors.textMuted} fontSize={11} allowDecimals={false} />
        <Tooltip
          contentStyle={{ backgroundColor: colors.cardBg, border: `1px solid ${colors.border}`, borderRadius: '8px' }}
          labelStyle={{ color: colors.textMain }}
        />
        <Line type="monotone" dataKey="count" stroke={colors.accent} strokeWidth={3} dot={{ fill: colors.accent, r: 4 }} name="Reservations" />
      </LineChart>
    </ResponsiveContainer>
  )}
</div>


              </>
            )}

          {activePage === 'events' && (
            loadingEvents ? (
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
                      const si = eventStatusInfo(event.status)
                      const StatusIcon = si.Icon
                      return (
                        <tr key={event.id} style={{ borderBottom: `1px solid ${colors.border}` }}>
                          <td style={{ padding: '16px', color: colors.textMain, fontSize: '14px', fontWeight: '600' }}>{event.title}</td>
                          <td style={{ padding: '16px', color: colors.textMuted, fontSize: '14px' }}>{event.location}</td>
                          <td style={{ padding: '16px', color: colors.textMuted, fontSize: '14px' }}>
                            {event.date_time ? new Date(event.date_time).toLocaleDateString('en-US') : '—'}
                          </td>
                          <td style={{ padding: '16px' }}>
                            <span style={{ display: 'inline-flex', alignItems: 'center', gap: '5px', fontSize: '12px', padding: '3px 10px', borderRadius: '12px', backgroundColor: si.bg, color: si.color, fontWeight: '600' }}>
                              <StatusIcon size={13} />
                              {si.label}
                            </span>
                            {event.status === 'pending' && event.pending_reason && (
                              <div style={{ fontSize: '11px', color: colors.textMuted, marginTop: '4px' }}>
                                {event.pending_reason === 'edited' ? 'Edited — re-approval needed' : 'New submission'}
                              </div>
                            )}
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
            )
          )}

          {activePage === 'history' && (
            loadingHistory ? (
              <p style={{ color: colors.textMuted }}>Loading...</p>
            ) : history.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '40px', backgroundColor: colors.cardBg, borderRadius: '16px', border: `1px solid ${colors.border}` }}>
                <p style={{ color: colors.textMuted }}>No past events yet.</p>
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
                    {history.map(event => {
                      const si = eventStatusInfo(event.status, event.date_time)
                      const StatusIcon = si.Icon
                      return (
                        <tr key={event.id} style={{ borderBottom: `1px solid ${colors.border}` }}>
                          <td style={{ padding: '16px', color: colors.textMain, fontSize: '14px', fontWeight: '600' }}>{event.title}</td>
                          <td style={{ padding: '16px', color: colors.textMuted, fontSize: '14px' }}>{event.location}</td>
                          <td style={{ padding: '16px', color: colors.textMuted, fontSize: '14px' }}>
                            {event.date_time ? new Date(event.date_time).toLocaleDateString('en-US') : '—'}
                          </td>
                          <td style={{ padding: '16px' }}>
                            <span style={{ display: 'inline-flex', alignItems: 'center', gap: '5px', fontSize: '12px', padding: '3px 10px', borderRadius: '12px', backgroundColor: si.bg, color: si.color, fontWeight: '600' }}>
                              <StatusIcon size={13} />
                              {si.label}
                            </span>
                          </td>
                          <td style={{ padding: '16px' }}>
                            <button onClick={() => setConfirmAction({ type: 'delete-event', event, fromHistory: true })} style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '6px 12px', backgroundColor: 'transparent', color: colors.error, border: `1px solid ${colors.error}`, borderRadius: '6px', fontSize: '12px', fontWeight: '600', cursor: 'pointer' }}>
                              <Trash2 size={14} /> Delete
                            </button>
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>
            )
          )}

          {activePage === 'users' && (
            loadingUsers ? (
              <p style={{ color: colors.textMuted }}>Loading users...</p>
            ) : users.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '60px', backgroundColor: colors.cardBg, borderRadius: '16px', border: `1px solid ${colors.border}` }}>
                <Users size={40} color={colors.textMuted} style={{ marginBottom: '12px' }} />
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
                              {user.role}
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
            )
          )}

        </div>
      </div>
      <ConfirmModal
        open={Boolean(confirmAction)}
        title={confirmDetails.title}
        message={confirmDetails.message}
        confirmLabel={confirmDetails.confirmLabel}
        tone={confirmDetails.tone}
        onCancel={() => setConfirmAction(null)}
        onConfirm={runConfirmedAction}
      />
    </div>
  )
}
