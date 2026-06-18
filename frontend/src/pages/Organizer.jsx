import { useState, useEffect } from "react"
import { Link } from "react-router-dom"

const colors = {
  bgDark: "#0f172a",
  cardBg: "#1e293b",
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

function statusStyle(status) {
  if (status === "upcoming") return { bg: "rgba(16,185,129,0.15)", color: colors.green }
  if (status === "cancelled") return { bg: "rgba(239,68,68,0.15)", color: colors.error }
  if (status === "past") return { bg: "rgba(245,158,11,0.15)", color: colors.warning }
  return { bg: "rgba(148,163,184,0.15)", color: colors.textMuted }
}

function getStoredUser() {
  try {
    return JSON.parse(localStorage.getItem("user"))
  } catch {
    return null
  }
}

function EventBanner({ event }) {
  const [hasError, setHasError] = useState(false)

  if (event.banner_url && !hasError) {
    return (
      <img
        src={event.banner_url}
        alt="Event banner"
        onError={() => setHasError(true)}
        style={{ width: "100%", height: "180px", objectFit: "cover", display: "block" }}
      />
    )
  }

  return (
    <div style={{ width: "100%", height: "180px", background: "linear-gradient(135deg, #4f46e5, #0f766e)", display: "flex", alignItems: "center", justifyContent: "center", color: "#fff", padding: "20px", textAlign: "center" }}>
      <div>
        <p style={{ fontSize: "12px", fontWeight: "700", letterSpacing: "2px", textTransform: "uppercase", opacity: 0.8, margin: "0 0 8px" }}>Event Banner</p>
        <p style={{ fontSize: "20px", fontWeight: "800", margin: 0 }}>{event.title}</p>
      </div>
    </div>
  )
}

export default function Organizer() {
  const [events, setEvents] = useState([])
  const [loading, setLoading] = useState(true)
  const [message, setMessage] = useState("")
  const token = localStorage.getItem("token")
  const user = getStoredUser()

  useEffect(() => {
    fetch("http://localhost:8000/api/events", {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then(r => r.json())
      .then(data => {
        const allEvents = Array.isArray(data) ? data : []
        setEvents(user?.id ? allEvents.filter(event => event.organizer_id === user.id) : allEvents)
        setLoading(false)
      })
      .catch(() => setLoading(false))
  }, [token, user?.id])

  async function handleCancel(eventId) {
    if (!window.confirm("Are you sure you want to cancel this event? RSVPs will be released.")) return
    setMessage("")

    try {
      const res = await fetch(`http://localhost:8000/api/events/${eventId}/cancel`, {
        method: "PATCH",
        headers: { Authorization: `Bearer ${token}` },
      })
      const data = await res.json().catch(() => ({}))

      if (res.ok) {
        setEvents(prev => prev.map(event =>
          event.id === eventId ? { ...event, status: "cancelled", going_count: 0, spots_left: event.capacity ?? null } : event
        ))
        setMessage(data.message || "Event cancelled successfully.")
      } else {
        setMessage(data.detail || "Could not cancel event.")
      }
    } catch {
      setMessage("Could not connect to the server.")
    }
  }

  async function handleArchive(eventId) {
    if (!window.confirm("Archive this event?")) return
    setMessage("")

    try {
      const res = await fetch(`http://localhost:8000/api/events/${eventId}/archive`, {
        method: "PATCH",
        headers: { Authorization: `Bearer ${token}` },
      })
      const data = await res.json().catch(() => ({}))

      if (res.ok) {
        setEvents(prev => prev.map(event =>
          event.id === eventId ? { ...event, status: "past" } : event
        ))
        setMessage(data.message || "Event archived successfully.")
      } else {
        setMessage(data.detail || "Could not archive event.")
      }
    } catch {
      setMessage("Could not connect to the server.")
    }
  }

  const totalReserved = events.reduce((sum, event) => sum + (Number(event.going_count) || 0), 0)

  return (
    <div style={{ backgroundColor: colors.bgDark, minHeight: "100vh", padding: "40px 20px", fontFamily: "'Inter', sans-serif" }}>
      <div style={{ maxWidth: "1200px", margin: "0 auto" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "40px", flexWrap: "wrap", gap: "16px" }}>
          <div>
            <p style={{ color: colors.accent, fontSize: "12px", fontWeight: "700", letterSpacing: "3px", textTransform: "uppercase", margin: "0 0 10px" }}>ORGANIZER</p>
            <h2 style={{ fontSize: "32px", fontWeight: "800", color: colors.textMain, margin: "0 0 8px" }}>My Events</h2>
            <p style={{ color: colors.textMuted, fontSize: "15px", margin: 0 }}>Manage event details, capacity, and reservations</p>
          </div>
          <Link to="/create-event" style={{ padding: "13px 24px", backgroundColor: colors.accent, color: "#fff", borderRadius: "10px", textDecoration: "none", fontSize: "14px", fontWeight: "700", boxShadow: "0 4px 20px rgba(99,102,241,0.4)" }}>
            + Create Event
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
              const status = statusStyle(event.status || "upcoming")
              return (
                <article key={event.id} style={{ backgroundColor: colors.cardBg, borderRadius: "12px", overflow: "hidden", border: `1px solid ${colors.border}` }}>
                  <EventBanner event={event} />

                  <div style={{ padding: "20px" }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: "12px", marginBottom: "12px" }}>
                      <h3 style={{ color: colors.textMain, fontSize: "18px", fontWeight: "800", margin: 0 }}>{event.title}</h3>
                      <span style={{ fontSize: "11px", padding: "4px 10px", borderRadius: "999px", backgroundColor: status.bg, color: status.color, fontWeight: "700", textTransform: "uppercase", flexShrink: 0 }}>
                        {event.status || "upcoming"}
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

                    <div style={{ display: "flex", gap: "8px" }}>
                      <button
                        onClick={() => handleArchive(event.id)}
                        disabled={event.status === "past"}
                        style={{ flex: 1, padding: "10px", backgroundColor: "rgba(245,158,11,0.1)", color: colors.warning, border: "1px solid rgba(245,158,11,0.3)", borderRadius: "8px", fontSize: "12px", fontWeight: "700", cursor: event.status === "past" ? "not-allowed" : "pointer", opacity: event.status === "past" ? 0.6 : 1 }}
                      >
                        Archive
                      </button>
                      <button
                        onClick={() => handleCancel(event.id)}
                        disabled={event.status === "cancelled"}
                        style={{ flex: 1, padding: "10px", backgroundColor: "rgba(239,68,68,0.1)", color: colors.error, border: "1px solid rgba(239,68,68,0.3)", borderRadius: "8px", fontSize: "12px", fontWeight: "700", cursor: event.status === "cancelled" ? "not-allowed" : "pointer", opacity: event.status === "cancelled" ? 0.6 : 1 }}
                      >
                        Cancel
                      </button>
                    </div>
                  </div>

                  <p style={{ color: colors.textMuted, fontSize: "13px", margin: "0 0 4px" }}>
                    📍 {event.location}
                  </p>

                  <p style={{ color: colors.textMuted, fontSize: "13px", margin: "0 0 4px" }}>
                    📅{" "}
                    {event.date_time
                      ? new Date(event.date_time).toLocaleString("en-US", {
                          dateStyle: "medium",
                          timeStyle: "short",
                        })
                      : ""}
                  </p>

                  <p style={{ color: colors.textMuted, fontSize: "13px", margin: "0 0 16px" }}>
                    👥 Capacity: {event.capacity ?? "N/A"}
                  </p>

                  <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
                    <button
                      onClick={() => editEvent(event)}
                      style={{
                        flex: 1,
                        padding: "8px",
                        backgroundColor: colors.accent,
                        color: "#fff",
                        border: "none",
                        borderRadius: "6px",
                        fontSize: "13px",
                        fontWeight: "600",
                        cursor: "pointer",
                      }}
                    >
                      Edit
                    </button>

                    <button
                      onClick={() => archiveEvent(event.id)}
                      style={{
                        flex: 1,
                        padding: "8px",
                        backgroundColor: "transparent",
                        color: colors.orange,
                        border: `1px solid ${colors.orange}`,
                        borderRadius: "6px",
                        fontSize: "13px",
                        fontWeight: "600",
                        cursor: "pointer",
                      }}
                    >
                      Archive
                    </button>

                    <button
                      onClick={() => cancelEvent(event.id)}
                      style={{
                        flex: 1,
                        padding: "8px",
                        backgroundColor: "transparent",
                        color: colors.error,
                        border: `1px solid ${colors.error}`,
                        borderRadius: "6px",
                        fontSize: "13px",
                        fontWeight: "600",
                        cursor: "pointer",
                      }}
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
