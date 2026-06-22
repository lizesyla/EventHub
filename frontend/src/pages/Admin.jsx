import { useState, useEffect } from "react"
import { Link } from "react-router-dom"
import { LayoutDashboard, Calendar, Users, Archive, LogOut, CheckCircle2, XCircle, Clock, PackageCheck, UserCheck, UserX, Trash2, Ban, User, Shield } from "lucide-react"
import { BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts"
import jsPDF from "jspdf"
import autoTable from "jspdf-autotable"
import NotificationBell from './NotificationBell'
import ConfirmModal from "../components/ConfirmModal"

const darkColors = {
  bgDark: '#15101f', cardBg: '#221c30', inputBg: '#15101f',
  textMain: '#ffffff', textMuted: '#9d94ad', accent: '#ec4899',
  accentSecondary: '#a855f7', border: '#332b42', error: '#ef4444', green: '#10b981'
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
  const headers = { "Authorization": `Bearer ${token}` }

  useEffect(() => {
    fetch("http://localhost:8000/api/events", { headers })
      .then(r => r.json())
      .then(data => { setEvents(Array.isArray(data) ? data : []); setLoadingEvents(false) })
      .catch(() => setLoadingEvents(false))

    fetch("http://localhost:8000/api/events/history", { headers })
      .then(r => r.json())
      .then(data => { setHistory(Array.isArray(data) ? data : []); setLoadingHistory(false) })
      .catch(() => setLoadingHistory(false))

    fetch("http://localhost:8000/api/admin/users", { headers })
      .then(r => r.json())
      .then(data => { setUsers(Array.isArray(data) ? data : []); setLoadingUsers(false) })
      .catch(() => setLoadingUsers(false))

      fetch("http://localhost:8000/api/admin/stats", { headers })
      .then(r => r.json())
      .then(data => setStats(data))
      .catch(() => {})
      
      fetch("http://localhost:8000/api/admin/rsvp-trends", { headers })
      .then(r => r.json())
      .then(data => setTrends(Array.isArray(data) ? data : []))
      .catch(() => {})
  }, [])

  function getConfirmDetails() {
    const event = confirmAction?.event
    const user = confirmAction?.user

    if (confirmAction?.type === 'approve-event') {
      return {
        title: 'Approve event?',
        message: `Are you sure you want to approve "${event?.title}"? This event will become visible to attendees.`,
        confirmLabel: 'Approve',
        tone: 'success',
      }
    }
    if (confirmAction?.type === 'reject-event') {
      return {
        title: 'Reject event?',
        message: `Are you sure you want to reject "${event?.title}"? The organizer will be notified.`,
        confirmLabel: 'Reject',
        tone: 'danger',
      }
    }
    if (confirmAction?.type === 'cancel-event') {
      return {
        title: 'Cancel event?',
        message: `Are you sure you want to cancel "${event?.title}"? Active reservations will be released and attendees will be notified.`,
        confirmLabel: 'Cancel Event',
        tone: 'warning',
      }
    }
    if (confirmAction?.type === 'delete-event') {
      return {
        title: 'Delete event?',
        message: `Are you sure you want to permanently delete "${event?.title}"? This cannot be undone.`,
        confirmLabel: 'Delete',
        tone: 'danger',
      }
    }
    if (confirmAction?.type === 'activate-user') {
      return {
        title: 'Activate user?',
        message: `Are you sure you want to activate ${user?.name}? They will be able to access EventHub.`,
        confirmLabel: 'Activate',
        tone: 'success',
      }
    }
    if (confirmAction?.type === 'deactivate-user') {
      return {
        title: 'Deactivate user?',
        message: `Are you sure you want to deactivate ${user?.name}? They will lose access until activated again.`,
        confirmLabel: 'Deactivate',
        tone: 'danger',
      }
    }

    return {
      title: 'Are you sure?',
      message: 'Please confirm this action.',
      confirmLabel: 'Confirm',
      tone: 'danger',
    }
  }

  async function runConfirmedAction() {
    const action = confirmAction
    if (!action) return

    setConfirmAction(null)

    if (action.type === 'approve-event') await approveEvent(action.event.id)
    if (action.type === 'reject-event') await rejectEvent(action.event.id)
    if (action.type === 'cancel-event') await cancelEvent(action.event.id)
    if (action.type === 'delete-event') await deleteEvent(action.event.id, action.fromHistory)
    if (action.type === 'activate-user') await handleApprove(action.user.id)
    if (action.type === 'deactivate-user') await handleDeactivate(action.user.id)
  }

  async function approveEvent(eventId) {
    const res = await fetch(`http://localhost:8000/api/events/${eventId}/approve`, {
      method: 'PATCH', headers
    })
    if (res.ok) {
      setEvents(prev => prev.map(e => e.id === eventId ? { ...e, status: 'upcoming' } : e))
      setMessage('Event approved successfully!')
      setTimeout(() => setMessage(''), 3000)
    }
  }

  async function rejectEvent(eventId) {
    const res = await fetch(`http://localhost:8000/api/events/${eventId}/reject`, {
      method: 'PATCH', headers
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
      method: 'DELETE', headers
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

  async function handleApprove(userId) {
    const res = await fetch(`http://localhost:8000/api/admin/users/${userId}/approve`, {
      method: 'PATCH', headers
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
      method: 'PATCH', headers
    })
    if (res.ok) {
      setUsers(prev => prev.map(u => u.id === userId ? { ...u, is_approved: false } : u))
    }
  }

  const eventStatusInfo = (status, dateTime) => {
  if (status === 'pending') return { Icon: Clock, label: 'Pending', bg: 'rgba(245,158,11,0.15)', color: '#f59e0b' }
  if (status === 'cancelled') return { Icon: XCircle, label: 'Cancelled', bg: 'rgba(239,68,68,0.15)', color: colors.error }
  if (status === 'past') return { Icon: PackageCheck, label: 'Archived', bg: colors.textMuted + '22', color: colors.textMuted }
  if (dateTime && new Date(dateTime) < new Date()) {
    return { Icon: PackageCheck, label: 'Expired', bg: colors.textMuted + '22', color: colors.textMuted }
  }
  return { Icon: CheckCircle2, label: 'Active', bg: 'rgba(16,185,129,0.15)', color: colors.green }
}

  const roleColor = (role) => {
    if (role === 'admin') return { bg: 'rgba(239,68,68,0.15)', color: colors.error, border: colors.error }
    return { bg: colors.accent + '22', color: colors.accent, border: colors.accent }
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
  const confirmDetails = getConfirmDetails()

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

      {/* MAIN CONTENT */}
      <div style={{ flex: 1, padding: '40px', overflowY: 'auto' }}>
        <div style={{ maxWidth: '1100px' }}>

      <div style={{ marginBottom: '32px', display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
  <div>
    <h2 style={{ fontSize: '28px', fontWeight: '800', color: colors.textMain, margin: '0 0 6px', letterSpacing: '-1px' }}>
      {pageInfo[activePage].title}
    </h2>
    <p style={{ color: colors.textMuted, fontSize: '14px', margin: 0 }}>
      {pageInfo[activePage].subtitle}
    </p>
  </div>

  <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
    {pendingReviewCount > 0 && (
      <button
        onClick={() => setActivePage('events')}
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          padding: '10px 14px',
          backgroundColor: '#f59e0b22',
          color: '#f59e0b',
          border: '1px solid #f59e0b55',
          borderRadius: '10px',
          fontSize: '13px',
          fontWeight: '800',
          cursor: 'pointer',
        }}
      >
        <Clock size={15} />
        Review Requests
        <span style={{
          minWidth: '20px',
          height: '20px',
          borderRadius: '999px',
          backgroundColor: '#f59e0b',
          color: '#1a162e',
          display: 'inline-flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: '11px',
          fontWeight: '900',
          padding: '0 6px',
        }}>
          {pendingReviewCount}
        </span>
      </button>
    )}
    <NotificationBell iconColor={colors.textMain} />
    {activePage === 'dashboard' && (
      <button
        onClick={exportPDF}
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          padding: '10px 18px',
          background: `linear-gradient(90deg, ${colors.accent}, ${colors.accentSecondary})`,
          color: '#fff',
          border: 'none',
          borderRadius: '10px',
          fontSize: '14px',
          fontWeight: '700',
          cursor: 'pointer',
          boxShadow: `0 4px 12px ${colors.accent}55`
        }}
      >
        Export PDF
      </button>
    )}
  </div>
</div>

         {(activePage === 'events' || activePage === 'users') && (
  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '16px', marginBottom: '32px' }}>
              {(activePage === 'users' ? [
                { label: 'Total Users', value: users.length, Icon: Users, color: colors.accent },
                { label: 'Active Users', value: users.filter(u => u.is_approved).length, Icon: UserCheck, color: colors.green },
                { label: 'Deactivated', value: users.filter(u => !u.is_approved).length, Icon: UserX, color: colors.error },
                { label: 'Admins', value: users.filter(u => u.role === 'admin').length, Icon: Shield, color: colors.accentSecondary },
              ] : activePage === 'events' ? [
                { label: 'Total Events', value: totalEvents, Icon: Calendar, color: colors.accent },
                { label: 'Pending Review', value: events.filter(e => e.status === 'pending').length, Icon: Clock, color: '#f59e0b' },
                { label: 'Active Events', value: events.filter(e => e.status === 'upcoming').length, Icon: CheckCircle2, color: colors.green },
                { label: 'Cancelled', value: history.filter(e => e.status === 'cancelled').length, Icon: XCircle, color: colors.error },
              ] : [
                { label: 'Total Events', value: totalEvents, Icon: Calendar, color: colors.accent },
                { label: 'Pending Review', value: events.filter(e => e.status === 'pending').length, Icon: Clock, color: '#f59e0b' },
                { label: 'Active Events', value: events.filter(e => e.status === 'upcoming').length, Icon: CheckCircle2, color: colors.green },
                { label: 'Cancelled', value: history.filter(e => e.status === 'cancelled').length, Icon: XCircle, color: colors.error },
                { label: 'Total Users', value: users.length, Icon: Users, color: colors.accentSecondary },
              ]).map((stat, i) => {
                const Icon = stat.Icon
                return (
                  <div key={i} style={{ backgroundColor: colors.cardBg, padding: '20px', borderRadius: '18px', border: `1px solid ${colors.border}` }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                      <div>
                        <p style={{ fontSize: '24px', fontWeight: '800', color: stat.color, margin: '0 0 4px' }}>{stat.value}</p>
                        <p style={{ fontSize: '12px', color: colors.textMuted, margin: 0 }}>{stat.label}</p>
                      </div>
                      <div style={{ width: '44px', height: '44px', borderRadius: '50%', backgroundColor: stat.color + '22', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <Icon size={20} color={stat.color} />
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          )}

          {message && (
            <div style={{ padding: '14px 16px', backgroundColor: colors.green + '22', border: `1px solid ${colors.green}55`, borderRadius: '10px', color: colors.green, fontSize: '14px', fontWeight: '600', marginBottom: '24px', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <CheckCircle2 size={16} />
              {message}
            </div>
          )}

          {activePage === 'dashboard' && (
              <>
                <div style={{
                  backgroundColor: colors.cardBg,
                  borderRadius: '20px',
                  border: `1px solid ${colors.border}`,
                  padding: '40px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  gap: '24px',
                  marginBottom: '32px'
                }}>
                  <div>
                    <p style={{ color: colors.textMuted, fontSize: '14px', margin: '0 0 6px' }}>Welcome back, Admin</p>
                    <h3 style={{ color: colors.textMain, fontSize: '24px', fontWeight: '800', margin: '0 0 8px' }}>
                      Oversee your events
                    </h3>
                    <p style={{ color: colors.textMuted, fontSize: '14px', margin: 0, maxWidth: '320px' }}>
                      Review submissions, manage users, and keep everything running smoothly.
                    </p>
                  </div>
                  <img
                    src="/images/event-illustration.png"
                    alt="Events illustration"
                    style={{ width: '180px', height: 'auto', flexShrink: 0 }}
                  />
                </div>
                

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(6, 1fr)', gap: '16px', marginBottom: '32px' }}>
                  <div style={{ backgroundColor: colors.cardBg, borderRadius: '16px', border: `1px solid ${colors.border}`, padding: '16px' }}>
                    <ProgressCircle value={totalEvents} max={totalEvents || 1} label="Total Events" color={colors.accent} colors={colors} />
                  </div>
                  <div style={{ backgroundColor: colors.cardBg, borderRadius: '16px', border: `1px solid ${colors.border}`, padding: '16px' }}>
                    <ProgressCircle value={events.filter(e => e.status === 'upcoming').length} max={totalEvents || 1} label="Active Events" color={colors.green} colors={colors} />
                  </div>
                  <div style={{ backgroundColor: colors.cardBg, borderRadius: '16px', border: `1px solid ${colors.border}`, padding: '16px' }}>
                    <ProgressCircle value={events.filter(e => e.status === 'pending').length} max={totalEvents || 1} label="Pending Review" color="#f59e0b" colors={colors} />
                  </div>
                  <div style={{ backgroundColor: colors.cardBg, borderRadius: '16px', border: `1px solid ${colors.border}`, padding: '16px' }}>
                   <ProgressCircle value={`${totalCapacity > 0 ? Math.round((totalGoing / totalCapacity) * 100) : 0}%`} max={100} percent={totalCapacity > 0 ? (totalGoing / totalCapacity) * 100 : 0} label="Capacity Filled" color={colors.accentSecondary} colors={colors} />
                  </div>
                  <div style={{ backgroundColor: colors.cardBg, borderRadius: '16px', border: `1px solid ${colors.border}`, padding: '16px' }}>
                    <ProgressCircle value={fullyBookedCount} max={totalEvents || 1} label="Fully Booked" color={colors.error} colors={colors} />
                  </div>
                  <div style={{ backgroundColor: colors.cardBg, borderRadius: '16px', border: `1px solid ${colors.border}`, padding: '16px' }}>
                    <ProgressCircle value={users.length} max={users.length || 1} label="Total Users" color="#06b6d4" colors={colors} />
                  </div>
                </div>

                <div style={{ backgroundColor: colors.cardBg, borderRadius: '16px', border: `1px solid ${colors.border}`, padding: '24px' }}>
  <h3 style={{ color: colors.textMain, fontSize: '16px', fontWeight: '700', margin: '0 0 20px' }}>
    Turnout per Event
  </h3>

  {stats.turnout.length === 0 ? (
  <p style={{ color: colors.textMuted, textAlign: 'center', padding: '40px' }}>No event data yet.</p>
) : (
  <div style={{ overflowX: 'auto' }}>
    <div style={{ width: `${Math.max(stats.turnout.length * 90, 600)}px`, height: '300px' }}>
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={stats.turnout}>
          <CartesianGrid strokeDasharray="3 3" stroke={colors.border} />
          <XAxis dataKey="title" stroke={colors.textMuted} fontSize={11} angle={-35} textAnchor="end" height={70} />
          <YAxis stroke={colors.textMuted} fontSize={11} />
          <Tooltip
            contentStyle={{ backgroundColor: colors.cardBg, border: `1px solid ${colors.border}`, borderRadius: '8px' }}
            labelStyle={{ color: colors.textMain }}
          />
          <Bar dataKey="going" fill={colors.accent} name="Reservations" radius={[6, 6, 0, 0]} />
          <Bar dataKey="capacity" fill={colors.accentSecondary} name="Capacity" radius={[6, 6, 0, 0]} opacity={0.4} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  </div>
)}

  </div>

<div style={{ backgroundColor: colors.cardBg, borderRadius: '16px', border: `1px solid ${colors.border}`, padding: '24px', marginTop: '24px' }}>
  <h3 style={{ color: colors.textMain, fontSize: '16px', fontWeight: '700', margin: '0 0 20px' }}>
    Top 5 Most Popular Events
  </h3>
  {stats.popular_events.length === 0 ? (
    <p style={{ color: colors.textMuted, textAlign: 'center', padding: '20px' }}>No reservation data yet.</p>
  ) : (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
      {stats.popular_events.map((event, i) => (
        <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
          <div style={{
            width: '28px', height: '28px', borderRadius: '50%',
            background: `linear-gradient(135deg, ${colors.accent}, ${colors.accentSecondary})`,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: '12px', fontWeight: '800', color: '#fff', flexShrink: 0
          }}>
            {i + 1}
          </div>
          <div style={{ flex: 1 }}>
            <p style={{ color: colors.textMain, fontSize: '14px', fontWeight: '600', margin: '0 0 4px' }}>{event.title}</p>
            <div style={{ width: '100%', height: '6px', backgroundColor: colors.border, borderRadius: '3px', overflow: 'hidden' }}>
              <div style={{
                height: '100%',
                width: `${event.capacity > 0 ? Math.min((event.going / event.capacity) * 100, 100) : (event.going > 0 ? 100 : 0)}%`,
                background: `linear-gradient(90deg, ${colors.accent}, ${colors.accentSecondary})`,
                borderRadius: '3px'
              }} />
            </div>
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
              <div style={{ textAlign: 'center', padding: '40px', backgroundColor: colors.cardBg, borderRadius: '16px', border: `1px solid ${colors.border}` }}>
                <p style={{ color: colors.textMuted }}>No upcoming events.</p>
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
                            <div style={{ display: 'flex', gap: '8px' }}>
                              {event.status === 'pending' ? (
                                <>
                                  <button onClick={() => setConfirmAction({ type: 'approve-event', event })} style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '6px 12px', backgroundColor: colors.green + '22', color: colors.green, border: `1px solid ${colors.green}55`, borderRadius: '6px', fontSize: '12px', fontWeight: '600', cursor: 'pointer' }}>
                                    <CheckCircle2 size={14} /> Approve
                                  </button>
                                  <button onClick={() => setConfirmAction({ type: 'reject-event', event })} style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '6px 12px', backgroundColor: 'transparent', color: colors.error, border: `1px solid ${colors.error}`, borderRadius: '6px', fontSize: '12px', fontWeight: '600', cursor: 'pointer' }}>
                                    <XCircle size={14} /> Reject
                                  </button>
                                  <button onClick={() => setConfirmAction({ type: 'delete-event', event, fromHistory: false })} style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '6px 12px', backgroundColor: 'transparent', color: colors.error, border: `1px solid ${colors.error}`, borderRadius: '6px', fontSize: '12px', fontWeight: '600', cursor: 'pointer' }}>
                                    <Trash2 size={14} /> Delete
                                  </button>
                                </>
                              ) : (
                                <>
                                  <button onClick={() => setConfirmAction({ type: 'cancel-event', event })} style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '6px 12px', backgroundColor: 'transparent', color: '#f59e0b', border: '1px solid #f59e0b', borderRadius: '6px', fontSize: '12px', fontWeight: '600', cursor: 'pointer' }}>
                                    <Ban size={14} /> Cancel
                                  </button>
                                  <button onClick={() => setConfirmAction({ type: 'delete-event', event, fromHistory: false })} style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '6px 12px', backgroundColor: 'transparent', color: colors.error, border: `1px solid ${colors.error}`, borderRadius: '6px', fontSize: '12px', fontWeight: '600', cursor: 'pointer' }}>
                                    <Trash2 size={14} /> Delete
                                  </button>
                                </>
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
                                {user.name.charAt(0).toUpperCase()}
                              </div>
                              <span style={{ color: colors.textMain, fontSize: '14px', fontWeight: '600' }}>{user.name}</span>
                            </div>
                          </td>
                          <td style={{ padding: '16px', color: colors.textMuted, fontSize: '14px' }}>{user.email}</td>
                          <td style={{ padding: '16px' }}>
                            <span style={{ fontSize: '12px', padding: '3px 10px', borderRadius: '12px', backgroundColor: rc.bg, color: rc.color, border: `1px solid ${rc.border}`, fontWeight: '600' }}>
                              {user.role}
                            </span>
                          </td>
                          <td style={{ padding: '16px' }}>
                            <span style={{ display: 'inline-flex', alignItems: 'center', gap: '5px', fontSize: '12px', padding: '3px 10px', borderRadius: '12px', fontWeight: '600',
                              backgroundColor: user.is_approved ? colors.green + '22' : colors.error + '22',
                              color: user.is_approved ? colors.green : colors.error
                            }}>
                              {user.is_approved ? <CheckCircle2 size={13} /> : <XCircle size={13} />}
                              {user.is_approved ? 'Active' : 'Deactivated'}
                            </span>
                          </td>
                          <td style={{ padding: '16px' }}>
                            <div style={{ display: 'flex', gap: '8px' }}>
                              {!user.is_approved && user.role !== 'admin' && (
                                <button onClick={() => setConfirmAction({ type: 'activate-user', user })} style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '6px 12px', backgroundColor: colors.green + '22', color: colors.green, border: `1px solid ${colors.green}55`, borderRadius: '6px', fontSize: '12px', fontWeight: '600', cursor: 'pointer' }}>
                                  <UserCheck size={14} /> Activate
                                </button>
                              )}
                              {user.is_approved && user.role !== 'admin' && (
                                <button onClick={() => setConfirmAction({ type: 'deactivate-user', user })} style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '6px 12px', backgroundColor: 'transparent', color: colors.error, border: `1px solid ${colors.error}`, borderRadius: '6px', fontSize: '12px', fontWeight: '600', cursor: 'pointer' }}>
                                  <UserX size={14} /> Deactivate
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
