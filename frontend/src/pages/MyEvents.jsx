import { Link } from "react-router-dom"
import { useEffect, useState } from "react"

const colors = {
  bgDark: "#0f172a",
  cardBg: "#1e293b",
  inputBg: "#0f172a",
  textMain: "#ffffff",
  textMuted: "#94a3b8",
  accent: "#6366f1",
  border: "#334155",
  error: "#ef4444",
  green: "#10b981",
  warning: "#f59e0b",
}

function formatDate(value) {
  if (!value) return "No date"
  return new Date(value).toLocaleString("en-US", {
    dateStyle: "medium",
    timeStyle: "short",
  })
}

function eventStatusLabel(status) {
  if (status === "pending") return "Pending Approval"
  if (status === "cancelled") return "Cancelled"
  if (status === "past") return "Archived"
  return "Live"
}

function eventStatusColor(status) {
  if (status === "pending") return { bg: "rgba(245,158,11,0.15)", color: colors.warning }
  if (status === "cancelled") return { bg: "rgba(239,68,68,0.15)", color: colors.error }
  if (status === "past") return { bg: "rgba(148,163,184,0.15)", color: colors.textMuted }
  return { bg: "rgba(16,185,129,0.15)", color: colors.green }
}

function EventBanner({ event }) {
  const [hasError, setHasError] = useState(false)

  if (event.banner_url && !hasError) {
    return (
      <img
        src={event.banner_url}
        alt="Event banner"
        onError={() => setHasError(true)}
        style={{ width: "100%", height: "160px", objectFit: "cover", display: "block" }}
      />
    )
  }

  return (
    <div style={{ width: "100%", height: "160px", background: "linear-gradient(135deg, #4f46e5, #0f766e)", display: "flex", alignItems: "center", justifyContent: "center", color: "#fff", padding: "20px", textAlign: "center" }}>
      <div>
        <p style={{ fontSize: "12px", fontWeight: "700", letterSpacing: "2px", textTransform: "uppercase", opacity: 0.8, margin: "0 0 8px" }}>EventHub</p>
        <p style={{ fontSize: "20px", fontWeight: "800", margin: 0 }}>{event.title}</p>
      </div>
    </div>
  )
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
    fetchMyStats()
  }, [token])

  function fetchMyEvents() {
    setLoading(true)
    fetch("http://localhost:8000/api/events/mine", {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then(response => response.json())
      .then(data => setEvents(Array.isArray(data) ? data : []))
      .catch(() => setEvents([]))
      .finally(() => setLoading(false))
  }

  function fetchMyStats() {
    fetch("http://localhost:8000/api/events/mine/stats", {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then(response => response.json())
      .then(data => setMyStats(data && !Array.isArray(data) ? data : null))
      .catch(() => setMyStats(null))
  }

  async function cancelEvent(eventId) {
    if (!window.confirm("Cancel this event? RSVPs will be released.")) return
    setMessage("")

    try {
      const res = await fetch(`http://localhost:8000/api/events/${eventId}/cancel`, {
        method: "PATCH",
        headers: { Authorization: `Bearer ${token}` },
      })
      const data = await res.json().catch(() => ({}))

      if (res.ok) {
        setEvents(prev => prev.map(event =>
          event.id === eventId
            ? { ...event, status: "cancelled", going_count: 0, spots_left: event.capacity ?? null }
            : event
        ))
        fetchMyStats()
        setMessage(data.message || "Event cancelled successfully.")
      } else {
        setMessage(data.detail || "Could not cancel event.")
      }
    } catch {
      setMessage("Could not connect to the server.")
    } finally {
      setTimeout(() => setMessage(""), 4000)
    }
  }

  async function viewGuests(event) {
    setGuestModalEvent(event)
    setLoadingGuests(true)
    try {
      const res = await fetch(`http://localhost:8000/api/events/${event.id}/guests`, {
        headers: { Authorization: `Bearer ${token}` },
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
      description: event.description || "",
      location: event.location,
      date_time: event.date_time?.slice(0, 16) || "",
      capacity: event.capacity ?? "",
    })
  }

  async function saveEdit(event) {
    const capacityValue = editForm.capacity
    if (!editForm.title?.trim() || editForm.title.trim().length < 3) {
      alert("Title must be at least 3 characters.")
      return
    }
    if (!editForm.location?.trim()) {
      alert("Location cannot be empty.")
      return
    }
    if (!editForm.date_time) {
      alert("Date and time are required.")
      return
    }
    if (capacityValue !== "") {
      const capacityNumber = Number(capacityValue)
      if (!Number.isInteger(capacityNumber) || capacityNumber < 1) {
        alert("Capacity must be a whole number of at least 1.")
        return
      }
      if (capacityNumber < (Number(event.going_count) || 0)) {
        alert("Capacity cannot be lower than the current RSVP count.")
        return
      }
    }

    const formData = new FormData()
    formData.append("title", editForm.title.trim())
    formData.append("description", editForm.description || "")
    formData.append("location", editForm.location.trim())
    formData.append("date_time", editForm.date_time)
    if (capacityValue !== "") formData.append("capacity", capacityValue)

    try {
      const res = await fetch(`http://localhost:8000/api/events/${event.id}`, {
        method: "PUT",
        headers: { Authorization: `Bearer ${token}` },
        body: formData,
      })
      const data = await res.json().catch(() => ({}))

      if (res.ok) {
        setEvents(prev => prev.map(item => item.id === event.id ? data.event : item))
        setEditingId(null)
        fetchMyStats()
        setMessage(data.requires_reapproval
          ? "Saved. This event was sent back for admin re-approval."
          : "Event updated successfully.")
        setTimeout(() => setMessage(""), 4000)
      } else {
        alert(data.detail || "Could not save changes.")
      }
    } catch {
      alert("Could not connect to the server.")
    }
  }

  const inputStyle = {
    width: "100%",
    padding: "10px 12px",
    borderRadius: "8px",
    border: `1px solid ${colors.border}`,
    backgroundColor: colors.inputBg,
    color: colors.textMain,
    fontSize: "14px",
    marginTop: "4px",
    boxSizing: "border-box",
  }

  const totalReserved = events.reduce((sum, event) => sum + (Number(event.going_count) || 0), 0)

  return (
    <div style={{ backgroundColor: colors.bgDark, minHeight: "100vh", padding: "40px 20px", fontFamily: "'Inter', sans-serif" }}>
      <div style={{ maxWidth: "1200px", margin: "0 auto" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "40px", flexWrap: "wrap", gap: "16px" }}>
          <div>
            <p style={{ color: colors.accent, fontSize: "12px", fontWeight: "700", letterSpacing: "3px", textTransform: "uppercase", margin: "0 0 10px" }}>MY EVENTS</p>
            <h2 style={{ fontSize: "32px", fontWeight: "800", color: colors.textMain, margin: "0 0 8px" }}>My Events</h2>
            <p style={{ color: colors.textMuted, fontSize: "15px", margin: 0 }}>Manage your event submissions, capacity, and reservations.</p>
          </div>
          <Link to="/create-event" style={{ padding: "13px 24px", backgroundColor: colors.accent, color: "#fff", borderRadius: "10px", textDecoration: "none", fontSize: "14px", fontWeight: "700", boxShadow: "0 4px 20px rgba(99,102,241,0.4)" }}>
            Create Event
          </Link>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(170px, 1fr))", gap: "16px", marginBottom: "32px" }}>
          {[
            { label: "Total Events", value: events.length, color: colors.accent },
            { label: "Upcoming", value: events.filter(event => event.status === "upcoming").length, color: colors.green },
            { label: "Reserved Seats", value: totalReserved, color: "#06b6d4" },
            { label: "Cancelled", value: events.filter(event => event.status === "cancelled").length, color: colors.error },
          ].map(stat => (
            <div key={stat.label} style={{ backgroundColor: colors.cardBg, padding: "20px", borderRadius: "12px", border: `1px solid ${colors.border}` }}>
              <p style={{ fontSize: "26px", fontWeight: "800", color: stat.color, margin: "0 0 4px" }}>{stat.value}</p>
              <p style={{ fontSize: "12px", color: colors.textMuted, margin: 0, textTransform: "uppercase", letterSpacing: "1px" }}>{stat.label}</p>
            </div>
          ))}
        </div>

        {myStats && myStats.total_events > 0 && (
          <div style={{ marginBottom: "32px", backgroundColor: colors.cardBg, borderRadius: "12px", border: `1px solid ${colors.border}`, padding: "20px" }}>
            <h3 style={{ color: colors.textMain, fontSize: "16px", fontWeight: "800", margin: "0 0 14px" }}>Popular Events</h3>
            {myStats.popular_events?.length ? (
              <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
                {myStats.popular_events.map((event, index) => (
                  <div key={`${event.title}-${index}`} style={{ display: "flex", justifyContent: "space-between", gap: "12px" }}>
                    <span style={{ color: colors.textMain, fontSize: "13px", fontWeight: "600" }}>{event.title}</span>
                    <span style={{ color: colors.textMuted, fontSize: "13px" }}>
                      {event.going}{event.capacity > 0 ? ` / ${event.capacity}` : ""} RSVPs
                    </span>
                  </div>
                ))}
              </div>
            ) : (
              <p style={{ color: colors.textMuted, margin: 0 }}>No RSVP data yet.</p>
            )}
          </div>
        )}

        {message && (
          <div style={{ padding: "12px 14px", backgroundColor: "rgba(99,102,241,0.1)", border: "1px solid rgba(99,102,241,0.3)", borderRadius: "8px", marginBottom: "18px", color: "#a5b4fc", fontSize: "14px", fontWeight: "600" }}>
            {message}
          </div>
        )}

        {loading ? (
          <p style={{ color: colors.textMuted }}>Loading events...</p>
        ) : events.length === 0 ? (
          <div style={{ textAlign: "center", padding: "80px", backgroundColor: colors.cardBg, borderRadius: "16px", border: `1px solid ${colors.border}` }}>
            <h3 style={{ color: colors.textMain, fontSize: "22px", fontWeight: "700", margin: "0 0 12px" }}>No events yet</h3>
            <p style={{ color: colors.textMuted, marginBottom: "28px" }}>Create your first event and start inviting people.</p>
            <Link to="/create-event" style={{ padding: "13px 28px", backgroundColor: colors.accent, color: "#fff", borderRadius: "10px", textDecoration: "none", fontSize: "14px", fontWeight: "600" }}>
              Create First Event
            </Link>
          </div>
        ) : (
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(360px, 1fr))", gap: "22px" }}>
            {events.map(event => {
              const status = eventStatusColor(event.status || "upcoming")
              const isEditing = editingId === event.id

              return (
                <article key={event.id} style={{ backgroundColor: colors.cardBg, borderRadius: "12px", overflow: "hidden", border: `1px solid ${colors.border}` }}>
                  {!isEditing && <EventBanner event={event} />}

                  <div style={{ padding: "20px" }}>
                    {!isEditing ? (
                      <>
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: "12px", marginBottom: "12px" }}>
                          <h3 style={{ color: colors.textMain, fontSize: "18px", fontWeight: "800", margin: 0 }}>{event.title}</h3>
                          <span style={{ fontSize: "11px", padding: "4px 10px", borderRadius: "999px", backgroundColor: status.bg, color: status.color, fontWeight: "700", textTransform: "uppercase", flexShrink: 0 }}>
                            {eventStatusLabel(event.status)}
                          </span>
                        </div>

                        <p style={{ color: colors.textMuted, fontSize: "14px", lineHeight: "1.6", margin: "0 0 16px", minHeight: "44px" }}>
                          {event.description || "No description provided."}
                        </p>

                        <div style={{ display: "grid", gap: "8px", marginBottom: "16px" }}>
                          <p style={{ color: colors.textMuted, fontSize: "13px", margin: 0 }}><strong style={{ color: colors.textMain }}>Date:</strong> {formatDate(event.date_time)}</p>
                          <p style={{ color: colors.textMuted, fontSize: "13px", margin: 0 }}><strong style={{ color: colors.textMain }}>Location:</strong> {event.location || "No location"}</p>
                        </div>

                        <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "8px", marginBottom: "18px", borderTop: `1px solid ${colors.border}`, borderBottom: `1px solid ${colors.border}`, padding: "12px 0" }}>
                          <div>
                            <p style={{ color: colors.textMuted, fontSize: "11px", margin: "0 0 4px", textTransform: "uppercase" }}>Capacity</p>
                            <p style={{ color: colors.textMain, fontSize: "18px", fontWeight: "800", margin: 0 }}>{event.capacity ?? "Unlimited"}</p>
                          </div>
                          <div>
                            <p style={{ color: colors.textMuted, fontSize: "11px", margin: "0 0 4px", textTransform: "uppercase" }}>Reserved</p>
                            <p style={{ color: colors.accent, fontSize: "18px", fontWeight: "800", margin: 0 }}>{event.going_count || 0}</p>
                          </div>
                          <div>
                            <p style={{ color: colors.textMuted, fontSize: "11px", margin: "0 0 4px", textTransform: "uppercase" }}>Free</p>
                            <p style={{ color: colors.green, fontSize: "18px", fontWeight: "800", margin: 0 }}>{event.spots_left ?? "Open"}</p>
                          </div>
                        </div>

                        <div style={{ display: "flex", flexWrap: "wrap", gap: "8px" }}>
                          {event.status !== "cancelled" && (
                            <>
                              <button onClick={() => startEdit(event)} style={{ padding: "10px 14px", backgroundColor: "rgba(99,102,241,0.15)", color: colors.accent, border: "1px solid rgba(99,102,241,0.3)", borderRadius: "8px", fontSize: "12px", fontWeight: "700", cursor: "pointer" }}>
                                Edit
                              </button>
                              <button onClick={() => cancelEvent(event.id)} style={{ padding: "10px 14px", backgroundColor: "rgba(239,68,68,0.1)", color: colors.error, border: "1px solid rgba(239,68,68,0.3)", borderRadius: "8px", fontSize: "12px", fontWeight: "700", cursor: "pointer" }}>
                                Cancel
                              </button>
                            </>
                          )}
                          <button onClick={() => viewGuests(event)} style={{ padding: "10px 14px", backgroundColor: "rgba(16,185,129,0.15)", color: colors.green, border: "1px solid rgba(16,185,129,0.3)", borderRadius: "8px", fontSize: "12px", fontWeight: "700", cursor: "pointer" }}>
                            View Guests
                          </button>
                        </div>
                      </>
                    ) : (
                      <div>
                        <label style={{ fontSize: "12px", color: colors.textMuted, fontWeight: "600" }}>Title</label>
                        <input value={editForm.title} onChange={e => setEditForm({ ...editForm, title: e.target.value })} style={inputStyle} />

                        <label style={{ fontSize: "12px", color: colors.textMuted, fontWeight: "600", marginTop: "12px", display: "block" }}>Description</label>
                        <textarea value={editForm.description} onChange={e => setEditForm({ ...editForm, description: e.target.value })} style={{ ...inputStyle, height: "70px", resize: "vertical" }} />

                        <label style={{ fontSize: "12px", color: colors.textMuted, fontWeight: "600", marginTop: "12px", display: "block" }}>Location</label>
                        <input value={editForm.location} onChange={e => setEditForm({ ...editForm, location: e.target.value })} style={inputStyle} />

                        <label style={{ fontSize: "12px", color: colors.textMuted, fontWeight: "600", marginTop: "12px", display: "block" }}>Date & Time</label>
                        <input type="datetime-local" value={editForm.date_time} onChange={e => setEditForm({ ...editForm, date_time: e.target.value })} style={inputStyle} />

                        <label style={{ fontSize: "12px", color: colors.textMuted, fontWeight: "600", marginTop: "12px", display: "block" }}>Capacity</label>
                        <input type="number" min="1" step="1" value={editForm.capacity} onChange={e => setEditForm({ ...editForm, capacity: e.target.value })} style={inputStyle} />

                        <div style={{ display: "flex", gap: "8px", marginTop: "16px" }}>
                          <button onClick={() => saveEdit(event)} style={{ flex: 1, padding: "10px", backgroundColor: colors.accent, color: "#fff", border: "none", borderRadius: "8px", fontSize: "14px", fontWeight: "700", cursor: "pointer" }}>
                            Save Changes
                          </button>
                          <button onClick={() => setEditingId(null)} style={{ flex: 1, padding: "10px", backgroundColor: "transparent", color: colors.textMuted, border: `1px solid ${colors.border}`, borderRadius: "8px", fontSize: "14px", fontWeight: "600", cursor: "pointer" }}>
                            Cancel
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                </article>
              )
            })}
          </div>
        )}
      </div>

      {guestModalEvent && (
        <div
          onClick={closeGuestModal}
          style={{ position: "fixed", inset: 0, backgroundColor: "rgba(0,0,0,0.7)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 100, padding: "20px" }}
        >
          <div
            onClick={e => e.stopPropagation()}
            style={{ backgroundColor: colors.cardBg, borderRadius: "16px", border: `1px solid ${colors.border}`, maxWidth: "500px", width: "100%", maxHeight: "70vh", overflowY: "auto", padding: "28px" }}
          >
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "20px" }}>
              <div>
                <p style={{ color: colors.accent, fontSize: "11px", fontWeight: "700", letterSpacing: "2px", textTransform: "uppercase", margin: "0 0 6px" }}>GUEST LIST</p>
                <h3 style={{ color: colors.textMain, fontSize: "20px", fontWeight: "800", margin: 0 }}>{guestModalEvent.title}</h3>
              </div>
              <button onClick={closeGuestModal} style={{ background: "none", border: "none", color: colors.textMuted, fontSize: "20px", cursor: "pointer" }}>x</button>
            </div>

            {loadingGuests ? (
              <p style={{ color: colors.textMuted }}>Loading guests...</p>
            ) : guests.length === 0 ? (
              <div style={{ textAlign: "center", padding: "40px 20px" }}>
                <p style={{ color: colors.textMuted, fontSize: "14px" }}>No one has RSVP'd yet.</p>
              </div>
            ) : (
              <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
                {guests.map((guest, index) => (
                  <div key={guest.id || index} style={{ display: "flex", alignItems: "center", gap: "12px", padding: "10px 12px", backgroundColor: colors.bgDark, borderRadius: "10px", border: `1px solid ${colors.border}` }}>
                    <div style={{ width: "36px", height: "36px", borderRadius: "50%", backgroundColor: colors.accent + "22", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "14px", fontWeight: "700", color: colors.accent, flexShrink: 0 }}>
                      {guest.name ? guest.name.charAt(0).toUpperCase() : "G"}
                    </div>
                    <div>
                      <p style={{ color: colors.textMain, fontSize: "14px", fontWeight: "600", margin: 0 }}>{guest.name}</p>
                      <p style={{ color: colors.textMuted, fontSize: "12px", margin: 0 }}>{guest.email}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}

            <p style={{ color: colors.textMuted, fontSize: "13px", textAlign: "center", marginTop: "20px", margin: "20px 0 0" }}>
              {guests.length} {guests.length === 1 ? "person is" : "people are"} going
            </p>
          </div>
        </div>
      )}
    </div>
  )
}
