import { Link } from "react-router-dom"
import { useState, useEffect } from "react"

const colors = {
  bgDark: '#0f172a', cardBg: '#1e293b', inputBg: '#0f172a',
  textMain: '#ffffff', textMuted: '#94a3b8', accent: '#6366f1',
  border: '#334155', error: '#ef4444', green: '#10b981'
}

const eventStatusLabel = (status) => {
  if (status === 'pending') return '⏳ Pending Approval'
  if (status === 'cancelled') return '❌ Cancelled'
  if (status === 'past') return '📦 Archived'
  return '✅ Live'
}

const eventStatusColor = (status) => {
  if (status === 'pending') return { bg: 'rgba(245,158,11,0.15)', color: '#f59e0b' }
  if (status === 'cancelled') return { bg: 'rgba(239,68,68,0.15)', color: '#ef4444' }
  if (status === 'past') return { bg: 'rgba(148,163,184,0.15)', color: '#94a3b8' }
  return { bg: 'rgba(16,185,129,0.15)', color: '#10b981' }
}

export default function MyEvents() {
  const [events, setEvents] = useState([])
  const [loading, setLoading] = useState(true)
  const [message, setMessage] = useState("")
  const [editingId, setEditingId] = useState(null)
  const [editForm, setEditForm] = useState({})
  const [guestModalEvent, setGuestModalEvent] = useState(null)
  const [guests, setGuests] = useState([])
  const [loadingGuests, setLoadingGuests] = useState(false)
  const [myStats, setMyStats] = useState(null)
  const token = localStorage.getItem("token")

  useEffect(() => {
    fetchMyEvents()
    fetch("http://localhost:8000/api/events/mine/stats", {
      headers: { 'Authorization': `Bearer ${token}` }
    })
      .then(r => r.json())
      .then(data => setMyStats(data))
      .catch(() => {})
  }, [])

  function fetchMyEvents() {
    fetch("http://localhost:8000/api/events/mine", {
      headers: { 'Authorization': `Bearer ${token}` }
    })
      .then(r => r.json())
      .then(data => { setEvents(Array.isArray(data) ? data : []); setLoading(false) })
      .catch(() => setLoading(false))
  }

  async function cancelEvent(eventId) {
    if (!window.confirm("Cancel this event? RSVPs will be released.")) return
    const res = await fetch(`http://localhost:8000/api/events/${eventId}/cancel`, {
      method: 'PATCH',
      headers: { 'Authorization': `Bearer ${token}` }
    })
    if (res.ok) {
      setEvents(prev => prev.map(e => e.id === eventId ? { ...e, status: 'cancelled' } : e))
      setMessage('Event cancelled.')
      setTimeout(() => setMessage(''), 3000)
    }
  }

  async function viewGuests(event) {
    setGuestModalEvent(event)
    setLoadingGuests(true)
    try {
      const res = await fetch(`http://localhost:8000/api/events/${event.id}/guests`, {
        headers: { 'Authorization': `Bearer ${token}` }
      })
      const data = await res.json()
      setGuests(Array.isArray(data.guests) ? data.guests : [])
    } catch {
      setGuests([])
    } finally {
      setLoadingGuests(false)
    }
  }

  function closeGuestModal() {
    setGuestModalEvent(null)
    setGuests([])
  }

  function startEdit(event) {
    setEditingId(event.id)
    setEditForm({
      title: event.title,
      description: event.description || '',
      location: event.location,
      date_time: event.date_time?.slice(0, 16),
      capacity: event.capacity || ''
    })
  }

  async function saveEdit(eventId) {
    const formData = new FormData()
    formData.append('title', editForm.title)
    formData.append('description', editForm.description)
    formData.append('location', editForm.location)
    formData.append('date_time', editForm.date_time)
    if (editForm.capacity) formData.append('capacity', editForm.capacity)

    const res = await fetch(`http://localhost:8000/api/events/${eventId}`, {
      method: 'PUT',
      headers: { 'Authorization': `Bearer ${token}` },
      body: formData
    })
    const data = await res.json()

    if (res.ok) {
      setEvents(prev => prev.map(e => e.id === eventId ? data.event : e))
      setEditingId(null)
      setMessage(data.requires_reapproval
        ? 'Saved! This event was sent back for admin re-approval because you changed the date, location, or capacity.'
        : 'Event updated successfully.')
      setTimeout(() => setMessage(''), 4000)
    } else {
      alert(data.detail || 'Could not save changes.')
    }
  }

  const inputStyle = {
    width: '100%', padding: '10px 12px', borderRadius: '8px',
    border: `1px solid ${colors.border}`, backgroundColor: colors.inputBg,
    color: colors.textMain, fontSize: '14px', marginTop: '4px', boxSizing: 'border-box'
  }

  return (
    <div style={{ backgroundColor: colors.bgDark, minHeight: '100vh', padding: '60px 20px', fontFamily: "'Inter', sans-serif" }}>
      <div style={{ maxWidth: '1100px', margin: '0 auto' }}>

        <div style={{ marginBottom: '40px' }}>
          <p style={{ color: colors.accent, fontSize: '12px', fontWeight: '700', letterSpacing: '3px', textTransform: 'uppercase', margin: '0 0 12px' }}>MY EVENTS</p>
          <h1 style={{ fontSize: '36px', fontWeight: '800', color: colors.textMain, margin: '0 0 8px', letterSpacing: '-1px' }}>
            Events you've created
          </h1>
        </div>

        {message && (
          <div style={{ padding: '14px 16px', backgroundColor: 'rgba(99,102,241,0.1)', border: '1px solid rgba(99,102,241,0.3)', borderRadius: '10px', color: '#a5b4fc', fontSize: '14px', fontWeight: '600', marginBottom: '24px' }}>
            ℹ️ {message}
          </div>
        )}

        {myStats && myStats.total_events > 0 && (
          <div style={{ marginBottom: '32px' }}>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '16px', marginBottom: '20px' }}>
              <div style={{ backgroundColor: colors.cardBg, padding: '20px', borderRadius: '14px', border: `1px solid ${colors.border}` }}>
                <p style={{ fontSize: '24px', fontWeight: '800', color: colors.accent, margin: '0 0 4px' }}>{myStats.total_rsvps}</p>
                <p style={{ fontSize: '12px', color: colors.textMuted, margin: 0 }}>Total RSVPs across your events</p>
              </div>
              <div style={{ backgroundColor: colors.cardBg, padding: '20px', borderRadius: '14px', border: `1px solid ${colors.border}` }}>
                <p style={{ fontSize: '24px', fontWeight: '800', color: colors.green, margin: '0 0 4px' }}>{myStats.total_events}</p>
                <p style={{ fontSize: '12px', color: colors.textMuted, margin: 0 }}>Events you've created</p>
              </div>
            </div>

            {myStats.popular_events.length > 0 && (
              <div style={{ backgroundColor: colors.cardBg, padding: '20px', borderRadius: '14px', border: `1px solid ${colors.border}` }}>
                <h4 style={{ color: colors.textMain, fontSize: '14px', fontWeight: '700', margin: '0 0 14px' }}>Your Most Popular Events</h4>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                  {myStats.popular_events.map((e, i) => (
                    <div key={i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span style={{ color: colors.textMain, fontSize: '13px', fontWeight: '600' }}>{e.title}</span>
                      <span style={{ color: colors.textMuted, fontSize: '13px' }}>
                        {e.going}{e.capacity > 0 ? ` / ${e.capacity} RSVPs` : ' RSVPs'}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {loading ? (
          <p style={{ color: colors.textMuted }}>Loading...</p>
        ) : events.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '100px 40px', backgroundColor: colors.cardBg, borderRadius: '24px', border: `1px solid ${colors.border}` }}>
            <p style={{ fontSize: '64px', marginBottom: '20px' }}>🎉</p>
            <h2 style={{ color: colors.textMain, fontSize: '26px', fontWeight: '800', margin: '0 0 12px' }}>
              You don't have any events yet
            </h2>
            <p style={{ color: colors.textMuted, fontSize: '16px', maxWidth: '420px', margin: '0 auto 32px', lineHeight: '1.6' }}>
              What are you waiting for? Create your first event and bring people together.
            </p>
            <Link to="/create-event" style={{ display: 'inline-block', padding: '14px 32px', backgroundColor: colors.accent, color: '#fff', borderRadius: '10px', textDecoration: 'none', fontSize: '15px', fontWeight: '700', boxShadow: '0 4px 20px rgba(99,102,241,0.4)' }}>
              🚀 Create Your First Event
            </Link>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            {events.map(event => {
              const sc = eventStatusColor(event.status)
              const isEditing = editingId === event.id

              return (
                <div key={event.id} style={{ backgroundColor: colors.cardBg, borderRadius: '16px', border: `1px solid ${colors.border}`, overflow: 'hidden' }}>
                  {!isEditing && event.banner_url && (
                    <img src={event.banner_url} alt="Banner" style={{ width: '100%', height: '90px', objectFit: 'cover' }} />
                  )}
                  <div style={{ padding: '24px' }}>
                  {!isEditing ? (
                    <>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '12px' }}>
                        <h3 style={{ color: colors.textMain, fontSize: '18px', fontWeight: '700', margin: 0 }}>{event.title}</h3>
                        <span style={{ fontSize: '12px', padding: '3px 10px', borderRadius: '12px', backgroundColor: sc.bg, color: sc.color, fontWeight: '600' }}>
                          {eventStatusLabel(event.status)}
                        </span>
                      </div>
                      <p style={{ color: colors.textMuted, fontSize: '13px', margin: '0 0 4px' }}>📍 {event.location}</p>
                      <p style={{ color: colors.textMuted, fontSize: '13px', margin: '0 0 4px' }}>
                        🗓️ {event.date_time ? new Date(event.date_time).toLocaleString('en-US', { dateStyle: 'medium', timeStyle: 'short' }) : ''}
                      </p>
                      {event.capacity != null && (
                        <p style={{ color: colors.textMuted, fontSize: '13px', margin: '0 0 16px' }}>
                          👥 {event.going_count || 0} / {event.capacity} RSVPs
                        </p>
                      )}
                      <div style={{ display: 'flex', gap: '8px' }}>
                        {event.status !== 'cancelled' && (
                          <>
                            <button onClick={() => startEdit(event)} style={{ padding: '8px 16px', backgroundColor: 'rgba(99,102,241,0.15)', color: colors.accent, border: '1px solid rgba(99,102,241,0.3)', borderRadius: '8px', fontSize: '13px', fontWeight: '600', cursor: 'pointer' }}>
                              ✏️ Edit
                            </button>
                            <button onClick={() => cancelEvent(event.id)} style={{ padding: '8px 16px', backgroundColor: 'transparent', color: colors.error, border: `1px solid ${colors.error}`, borderRadius: '8px', fontSize: '13px', fontWeight: '600', cursor: 'pointer' }}>
                              ⛔ Cancel
                            </button>
                          </>
                        )}
                        <button onClick={() => viewGuests(event)} style={{ padding: '8px 16px', backgroundColor: 'rgba(16,185,129,0.15)', color: colors.green, border: '1px solid rgba(16,185,129,0.3)', borderRadius: '8px', fontSize: '13px', fontWeight: '600', cursor: 'pointer' }}>
                          👥 View Guests
                        </button>
                      </div>
                    </>
                  ) : (
                    <div>
                      <label style={{ fontSize: '12px', color: colors.textMuted, fontWeight: '600' }}>Title</label>
                      <input value={editForm.title} onChange={e => setEditForm({ ...editForm, title: e.target.value })} style={inputStyle} />

                      <label style={{ fontSize: '12px', color: colors.textMuted, fontWeight: '600', marginTop: '12px', display: 'block' }}>Description</label>
                      <textarea value={editForm.description} onChange={e => setEditForm({ ...editForm, description: e.target.value })} style={{ ...inputStyle, height: '70px', resize: 'vertical' }} />

                      <label style={{ fontSize: '12px', color: colors.textMuted, fontWeight: '600', marginTop: '12px', display: 'block' }}>Location</label>
                      <input value={editForm.location} onChange={e => setEditForm({ ...editForm, location: e.target.value })} style={inputStyle} />

                      <label style={{ fontSize: '12px', color: colors.textMuted, fontWeight: '600', marginTop: '12px', display: 'block' }}>Date & Time</label>
                      <input type="datetime-local" value={editForm.date_time} onChange={e => setEditForm({ ...editForm, date_time: e.target.value })} style={inputStyle} />

                      <label style={{ fontSize: '12px', color: colors.textMuted, fontWeight: '600', marginTop: '12px', display: 'block' }}>Capacity</label>
                      <input type="number" value={editForm.capacity} onChange={e => setEditForm({ ...editForm, capacity: e.target.value })} style={inputStyle} />

                      <div style={{ display: 'flex', gap: '8px', marginTop: '16px' }}>
                        <button onClick={() => saveEdit(event.id)} style={{ flex: 1, padding: '10px', backgroundColor: colors.accent, color: '#fff', border: 'none', borderRadius: '8px', fontSize: '14px', fontWeight: '700', cursor: 'pointer' }}>
                          Save Changes
                        </button>
                        <button onClick={() => setEditingId(null)} style={{ flex: 1, padding: '10px', backgroundColor: 'transparent', color: colors.textMuted, border: `1px solid ${colors.border}`, borderRadius: '8px', fontSize: '14px', fontWeight: '600', cursor: 'pointer' }}>
                          Cancel
                        </button>
                      </div>
                    </div>
                  )}
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>

      {guestModalEvent && (
        <div
          onClick={closeGuestModal}
          style={{
            position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.7)',
            display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100, padding: '20px'
          }}
        >
          <div
            onClick={e => e.stopPropagation()}
            style={{
              backgroundColor: colors.cardBg, borderRadius: '16px', border: `1px solid ${colors.border}`,
              maxWidth: '500px', width: '100%', maxHeight: '70vh', overflowY: 'auto', padding: '28px'
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '20px' }}>
              <div>
                <p style={{ color: colors.accent, fontSize: '11px', fontWeight: '700', letterSpacing: '2px', textTransform: 'uppercase', margin: '0 0 6px' }}>GUEST LIST</p>
                <h3 style={{ color: colors.textMain, fontSize: '20px', fontWeight: '800', margin: 0 }}>{guestModalEvent.title}</h3>
              </div>
              <button onClick={closeGuestModal} style={{ background: 'none', border: 'none', color: colors.textMuted, fontSize: '20px', cursor: 'pointer' }}>✕</button>
            </div>

            {loadingGuests ? (
              <p style={{ color: colors.textMuted }}>Loading guests...</p>
            ) : guests.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '40px 20px' }}>
                <p style={{ fontSize: '40px', marginBottom: '12px' }}>👀</p>
                <p style={{ color: colors.textMuted, fontSize: '14px' }}>No one has RSVP'd yet.</p>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                {guests.map((guest, i) => (
                  <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '10px 12px', backgroundColor: colors.bgDark, borderRadius: '10px', border: `1px solid ${colors.border}` }}>
                    <div style={{ width: '36px', height: '36px', borderRadius: '50%', backgroundColor: colors.accent + '22', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '14px', fontWeight: '700', color: colors.accent, flexShrink: 0 }}>
                      {guest.name.charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <p style={{ color: colors.textMain, fontSize: '14px', fontWeight: '600', margin: 0 }}>{guest.name}</p>
                      <p style={{ color: colors.textMuted, fontSize: '12px', margin: 0 }}>{guest.email}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}

            <p style={{ color: colors.textMuted, fontSize: '13px', textAlign: 'center', marginTop: '20px', margin: '20px 0 0' }}>
              {guests.length} {guests.length === 1 ? 'person is' : 'people are'} going
            </p>
          </div>
        </div>
      )}
    </div>
  )
}