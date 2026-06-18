import { Link } from "react-router-dom"
import { useState, useEffect } from "react"

const colors = {
  bgDark: "#0f172a",
  cardBg: "#1e293b",
  panelBg: "#111827",
  textMain: "#ffffff",
  textMuted: "#94a3b8",
  accent: "#6366f1",
  border: "#334155",
  green: "#10b981",
  error: "#ef4444",
  warning: "#f59e0b",
}

function getErrorMessage(detail) {
  if (typeof detail === "string") return detail
  if (Array.isArray(detail)) {
    return detail.map(item => item.msg || item.message || "Reservation failed.").join(" ")
  }
  return "Reservation failed."
}

function getStoredRole() {
  try {
    return JSON.parse(localStorage.getItem("user"))?.role || null
  } catch {
    return null
  }
}

function formatDate(value) {
  if (!value) return "No date"
  return new Date(value).toLocaleString("en-US", {
    dateStyle: "full",
    timeStyle: "short",
  })
}

function EventBanner({ event }) {
  const [hasError, setHasError] = useState(false)

  if (event.banner_url && !hasError) {
    return (
      <img
        src={event.banner_url}
        alt="Event banner"
        onError={() => setHasError(true)}
        style={{ width: "100%", height: "200px", objectFit: "cover", display: "block" }}
      />
    )
  }

  return (
    <div style={{ width: "100%", height: "200px", background: "linear-gradient(135deg, #4f46e5, #0f766e)", display: "flex", alignItems: "center", justifyContent: "center", color: "#fff", padding: "20px", textAlign: "center" }}>
      <div>
        <p style={{ fontSize: "12px", fontWeight: "700", letterSpacing: "2px", textTransform: "uppercase", opacity: 0.8, margin: "0 0 8px" }}>Event Banner</p>
        <p style={{ fontSize: "20px", fontWeight: "800", margin: 0 }}>{event.title}</p>
      </div>
    </div>
  )
}

export default function Events() {
  const [events, setEvents] = useState([])
  const [loading, setLoading] = useState(true)
  const [rsvpMsg, setRsvpMsg] = useState({ id: null, msg: "", type: "" })
  const [rsvpingId, setRsvpingId] = useState(null)
  const [rsvpedEventIds, setRsvpedEventIds] = useState([])
  const [selectedEventId, setSelectedEventId] = useState(null)
  const token = localStorage.getItem("token")
  const userRole = getStoredRole()
  const selectedEvent = selectedEventId ? events.find(event => event.id === selectedEventId) : null

  useEffect(() => {
    fetch("http://localhost:8000/api/events")
      .then(r => r.json())
      .then(data => {
        setEvents(Array.isArray(data) ? data : [])
        setLoading(false)
      })
      .catch(() => setLoading(false))

    if (token && userRole === "attendee") {
      fetch("http://localhost:8000/api/events/my-rsvps", {
        headers: { Authorization: `Bearer ${token}` },
      })
        .then(r => r.ok ? r.json() : { event_ids: [] })
        .then(data => setRsvpedEventIds(Array.isArray(data.event_ids) ? data.event_ids : []))
        .catch(() => setRsvpedEventIds([]))
    }
  }, [token, userRole])

  useEffect(() => {
    if (!selectedEventId) return undefined

    function handleKeyDown(event) {
      if (event.key === "Escape") setSelectedEventId(null)
    }

    window.addEventListener("keydown", handleKeyDown)
    return () => window.removeEventListener("keydown", handleKeyDown)
  }, [selectedEventId])

  function updateEventCounts(eventId, data, delta) {
    setEvents(prev => prev.map(event => {
      if (event.id !== eventId) return event

      const currentCount = Number(event.going_count) || 0
      const nextCount = typeof data.spots_taken === "number"
        ? data.spots_taken
        : Math.max(currentCount + delta, 0)

      return {
        ...event,
        going_count: nextCount,
        spots_left: event.capacity == null ? null : Math.max(event.capacity - nextCount, 0),
      }
    }))
  }

  async function handleRSVP(eventId) {
    if (!token) {
      setRsvpMsg({ id: eventId, msg: "Please sign in to reserve a seat for this event.", type: "warn" })
      setTimeout(() => setRsvpMsg({ id: null, msg: "", type: "" }), 3000)
      return
    }

    if (userRole !== "attendee") {
      setRsvpMsg({ id: eventId, msg: "Only attendee accounts can reserve seats.", type: "warn" })
      setTimeout(() => setRsvpMsg({ id: null, msg: "", type: "" }), 3000)
      return
    }

    setRsvpingId(eventId)
    setRsvpMsg({ id: null, msg: "", type: "" })

    try {
      const res = await fetch(`http://localhost:8000/api/events/${eventId}/rsvp`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
      })
      const data = await res.json().catch(() => ({}))

      if (res.ok) {
        setRsvpedEventIds(prev => prev.includes(eventId) ? prev : [...prev, eventId])
        updateEventCounts(eventId, data, 1)
        setRsvpMsg({ id: eventId, msg: "Seat reserved successfully.", type: "success" })
      } else {
        setRsvpMsg({ id: eventId, msg: getErrorMessage(data.detail), type: "warn" })
      }
    } catch {
      setRsvpMsg({ id: eventId, msg: "Could not connect to the server.", type: "warn" })
    } finally {
      setRsvpingId(null)
      setTimeout(() => setRsvpMsg({ id: null, msg: "", type: "" }), 3500)
    }
  }

  async function handleCancelRSVP(eventId) {
    setRsvpingId(eventId)
    setRsvpMsg({ id: null, msg: "", type: "" })

    try {
      const res = await fetch(`http://localhost:8000/api/events/${eventId}/rsvp`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      })
      const data = await res.json().catch(() => ({}))

      if (res.ok) {
        setRsvpedEventIds(prev => prev.filter(id => id !== eventId))
        updateEventCounts(eventId, data, -1)
        setRsvpMsg({ id: eventId, msg: "Reservation cancelled successfully.", type: "success" })
      } else {
        setRsvpMsg({ id: eventId, msg: getErrorMessage(data.detail), type: "warn" })
      }
    } catch {
      setRsvpMsg({ id: eventId, msg: "Could not connect to the server.", type: "warn" })
    } finally {
      setRsvpingId(null)
      setTimeout(() => setRsvpMsg({ id: null, msg: "", type: "" }), 3500)
    }
  }

  function getRsvpButtonText(event) {
    if (event.status === "cancelled") return "Event Cancelled"
    if (rsvpingId === event.id) return "Saving reservation..."
    if (rsvpedEventIds.includes(event.id)) return "Cancel reservation"
    if (token && userRole !== "attendee") return "Attendee only"
    if (event.capacity != null && event.spots_left === 0) return "Event Full"
    return token ? "Reserve now" : "Sign in to reserve"
  }

  const selectedIsRsvped = selectedEvent ? rsvpedEventIds.includes(selectedEvent.id) : false
  const selectedIsRsvping = selectedEvent ? rsvpingId === selectedEvent.id : false
  const selectedIsFull = selectedEvent ? selectedEvent.capacity != null && selectedEvent.spots_left === 0 : false
  const selectedIsUnavailable = selectedEvent ? selectedEvent.status === "cancelled" || (!selectedIsRsvped && selectedIsFull) : false
  const selectedIsDisabled = selectedEvent
    ? selectedEvent.status === "cancelled" || selectedIsRsvping || (!selectedIsRsvped && (selectedIsFull || (token && userRole !== "attendee")))
    : true

  return (
    <div style={{ backgroundColor: colors.bgDark, minHeight: "100vh", padding: "60px 20px", fontFamily: "'Inter', sans-serif" }}>
      <div style={{ maxWidth: "1200px", margin: "0 auto" }}>
        <div style={{ marginBottom: "48px" }}>
          <p style={{ color: colors.accent, fontSize: "12px", fontWeight: "700", letterSpacing: "3px", textTransform: "uppercase", margin: "0 0 12px" }}>DISCOVER</p>
          <h1 style={{ fontSize: "40px", fontWeight: "800", color: colors.textMain, margin: "0 0 12px", letterSpacing: "-1.5px" }}>
            Upcoming Events
          </h1>
          <p style={{ color: colors.textMuted, fontSize: "16px", margin: 0 }}>
            {loading ? "" : events.length > 0 ? `${events.length} event${events.length > 1 ? "s" : ""} available` : "No events yet"}
          </p>
        </div>

        {loading ? (
          <div style={{ textAlign: "center", padding: "80px" }}>
            <p style={{ color: colors.textMuted, fontSize: "16px" }}>Loading events...</p>
          </div>
        ) : events.length === 0 ? (
          <div style={{ textAlign: "center", padding: "80px", backgroundColor: colors.cardBg, borderRadius: "24px", border: `1px solid ${colors.border}` }}>
            <p style={{ color: colors.textMuted, margin: "0 0 28px" }}>No events yet. Check back soon.</p>
            {!token && (
              <Link to="/register" style={{ padding: "13px 28px", backgroundColor: colors.accent, color: "#fff", borderRadius: "10px", textDecoration: "none", fontSize: "14px", fontWeight: "600" }}>
                Create an account
              </Link>
            )}
          </div>
        ) : (
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(340px, 1fr))", gap: "24px" }}>
            {events.map(event => {
              const isRsvped = rsvpedEventIds.includes(event.id)
              const isRsvping = rsvpingId === event.id
              const isFull = event.capacity != null && event.spots_left === 0
              const isUnavailable = event.status === "cancelled" || (!isRsvped && isFull)
              const isDisabled = event.status === "cancelled" || isRsvping || (!isRsvped && (isFull || (token && userRole !== "attendee")))

              return (
                <div
                  key={event.id}
                  role="button"
                  tabIndex={0}
                  aria-label={`View details for ${event.title}`}
                  onClick={() => setSelectedEventId(event.id)}
                  onKeyDown={e => {
                    if (e.key === "Enter" || e.key === " ") {
                      e.preventDefault()
                      setSelectedEventId(event.id)
                    }
                  }}
                  style={{ backgroundColor: colors.cardBg, borderRadius: "20px", overflow: "hidden", border: `1px solid ${colors.border}`, transition: "transform 0.3s ease, box-shadow 0.3s ease", cursor: "pointer" }}
                  onMouseEnter={e => { e.currentTarget.style.transform = "translateY(-6px)"; e.currentTarget.style.boxShadow = "0 20px 60px rgba(99,102,241,0.15)" }}
                  onMouseLeave={e => { e.currentTarget.style.transform = "translateY(0)"; e.currentTarget.style.boxShadow = "none" }}
                >
                  <EventBanner event={event} />

                  <div style={{ padding: "24px" }}>
                    {event.status && event.status !== "upcoming" && (
                      <span style={{ fontSize: "11px", padding: "3px 10px", borderRadius: "20px", backgroundColor: event.status === "cancelled" ? "rgba(239,68,68,0.15)" : "rgba(148,163,184,0.15)", color: event.status === "cancelled" ? colors.error : colors.textMuted, fontWeight: "700", display: "inline-block", marginBottom: "10px" }}>
                        {event.status}
                      </span>
                    )}

                    <h3 style={{ color: colors.textMain, fontSize: "18px", fontWeight: "700", margin: "0 0 12px", letterSpacing: "-0.3px" }}>{event.title}</h3>
                    <p style={{ color: colors.textMuted, fontSize: "13px", margin: "0 0 6px" }}>Location: {event.location}</p>
                    <p style={{ color: colors.textMuted, fontSize: "13px", margin: "0 0 6px" }}>
                      {formatDate(event.date_time)}
                    </p>
                    {event.capacity != null ? (
                      <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "8px", margin: "16px 0 0" }}>
                        <div style={{ padding: "10px", borderRadius: "8px", backgroundColor: "rgba(148,163,184,0.1)", border: `1px solid ${colors.border}` }}>
                          <p style={{ color: colors.textMuted, fontSize: "11px", margin: "0 0 4px", textTransform: "uppercase" }}>Capacity</p>
                          <p style={{ color: colors.textMain, fontSize: "16px", fontWeight: "800", margin: 0 }}>{event.capacity}</p>
                        </div>
                        <div style={{ padding: "10px", borderRadius: "8px", backgroundColor: "rgba(99,102,241,0.1)", border: "1px solid rgba(99,102,241,0.25)" }}>
                          <p style={{ color: colors.textMuted, fontSize: "11px", margin: "0 0 4px", textTransform: "uppercase" }}>Reserved</p>
                          <p style={{ color: colors.accent, fontSize: "16px", fontWeight: "800", margin: 0 }}>{event.going_count || 0}</p>
                        </div>
                        <div style={{ padding: "10px", borderRadius: "8px", backgroundColor: "rgba(16,185,129,0.1)", border: "1px solid rgba(16,185,129,0.25)" }}>
                          <p style={{ color: colors.textMuted, fontSize: "11px", margin: "0 0 4px", textTransform: "uppercase" }}>Free</p>
                          <p style={{ color: colors.green, fontSize: "16px", fontWeight: "800", margin: 0 }}>{event.spots_left ?? event.capacity}</p>
                        </div>
                      </div>
                    ) : (
                      <p style={{ color: colors.textMuted, fontSize: "13px", margin: "16px 0 0" }}>Unlimited capacity</p>
                    )}
                    {event.description && (
                      <p style={{ color: colors.textMuted, fontSize: "14px", margin: "12px 0 0", lineHeight: "1.6", display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical", overflow: "hidden" }}>
                        {event.description}
                      </p>
                    )}

                    {rsvpMsg.id === event.id && (
                      <div style={{ marginTop: "12px", padding: "10px 14px", backgroundColor: rsvpMsg.type === "success" ? "rgba(16,185,129,0.1)" : "rgba(245,158,11,0.1)", border: `1px solid ${rsvpMsg.type === "success" ? "rgba(16,185,129,0.3)" : "rgba(245,158,11,0.3)"}`, borderRadius: "8px", color: rsvpMsg.type === "success" ? colors.green : "#f59e0b", fontSize: "13px", fontWeight: "600" }}>
                        {rsvpMsg.msg}
                      </div>
                    )}

                    <button
                      onClick={e => {
                        e.stopPropagation()
                        setSelectedEventId(event.id)
                      }}
                      style={{
                        width: "100%",
                        marginTop: "18px",
                        padding: "11px 12px",
                        backgroundColor: "rgba(148,163,184,0.08)",
                        color: colors.textMain,
                        border: `1px solid ${colors.border}`,
                        borderRadius: "10px",
                        fontSize: "14px",
                        fontWeight: "700",
                        cursor: "pointer",
                      }}
                    >
                      View details
                    </button>

                    <button
                      onClick={e => {
                        e.stopPropagation()
                        if (isRsvped) {
                          handleCancelRSVP(event.id)
                        } else {
                          handleRSVP(event.id)
                        }
                      }}
                      disabled={isDisabled}
                      style={{
                        width: "100%",
                        marginTop: "10px",
                        padding: "12px",
                        backgroundColor: isUnavailable ? "rgba(148,163,184,0.1)" : isRsvped ? "rgba(239,68,68,0.12)" : token ? colors.accent : "transparent",
                        color: isUnavailable ? colors.textMuted : isRsvped ? colors.error : token ? "#fff" : colors.accent,
                        border: isUnavailable ? `1px solid ${colors.border}` : isRsvped ? `1px solid ${colors.error}` : token ? "none" : `1px solid ${colors.accent}`,
                        borderRadius: "10px",
                        fontSize: "14px",
                        fontWeight: "700",
                        cursor: isDisabled ? "not-allowed" : "pointer",
                        boxShadow: token && event.status !== "cancelled" && !isRsvped && !isFull ? "0 4px 14px rgba(99,102,241,0.4)" : "none",
                        transition: "all 0.2s ease",
                      }}
                    >
                      {getRsvpButtonText(event)}
                    </button>
                  </div>
                </div>
              )
            })}
          </div>
        )}

        {selectedEvent && (
          <div
            role="dialog"
            aria-modal="true"
            aria-label={`${selectedEvent.title} details`}
            onClick={() => setSelectedEventId(null)}
            style={{ position: "fixed", inset: 0, zIndex: 50, backgroundColor: "rgba(15,23,42,0.86)", padding: "32px 16px", overflowY: "auto" }}
          >
            <div
              onClick={e => e.stopPropagation()}
              style={{ width: "100%", maxWidth: "820px", margin: "0 auto", backgroundColor: colors.cardBg, border: `1px solid ${colors.border}`, borderRadius: "18px", overflow: "hidden", boxShadow: "0 28px 90px rgba(0,0,0,0.45)" }}
            >
              <div style={{ position: "relative" }}>
                <EventBanner event={selectedEvent} />
                <button
                  type="button"
                  aria-label="Close details"
                  onClick={() => setSelectedEventId(null)}
                  style={{ position: "absolute", top: "14px", right: "14px", width: "38px", height: "38px", borderRadius: "50%", border: "1px solid rgba(255,255,255,0.35)", backgroundColor: "rgba(15,23,42,0.72)", color: "#fff", fontSize: "18px", fontWeight: "800", cursor: "pointer" }}
                >
                  X
                </button>
              </div>

              <div style={{ padding: "26px" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: "16px", marginBottom: "16px", flexWrap: "wrap" }}>
                  <div>
                    <p style={{ color: colors.accent, fontSize: "12px", fontWeight: "800", letterSpacing: "2px", textTransform: "uppercase", margin: "0 0 8px" }}>Event Details</p>
                    <h2 style={{ color: colors.textMain, fontSize: "28px", fontWeight: "800", margin: 0 }}>{selectedEvent.title}</h2>
                  </div>
                  <span style={{ fontSize: "12px", padding: "5px 12px", borderRadius: "999px", backgroundColor: selectedEvent.status === "cancelled" ? "rgba(239,68,68,0.15)" : selectedEvent.status === "past" ? "rgba(245,158,11,0.15)" : "rgba(16,185,129,0.15)", color: selectedEvent.status === "cancelled" ? colors.error : selectedEvent.status === "past" ? colors.warning : colors.green, fontWeight: "800", textTransform: "uppercase" }}>
                    {selectedEvent.status || "upcoming"}
                  </span>
                </div>

                <p style={{ color: colors.textMuted, fontSize: "15px", lineHeight: "1.7", margin: "0 0 22px", whiteSpace: "pre-wrap" }}>
                  {selectedEvent.description || "No description provided."}
                </p>

                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(210px, 1fr))", gap: "12px", marginBottom: "20px" }}>
                  <div style={{ backgroundColor: colors.panelBg, border: `1px solid ${colors.border}`, borderRadius: "10px", padding: "14px" }}>
                    <p style={{ color: colors.textMuted, fontSize: "12px", margin: "0 0 6px", textTransform: "uppercase" }}>Date and time</p>
                    <p style={{ color: colors.textMain, fontSize: "14px", fontWeight: "700", lineHeight: "1.5", margin: 0 }}>{formatDate(selectedEvent.date_time)}</p>
                  </div>
                  <div style={{ backgroundColor: colors.panelBg, border: `1px solid ${colors.border}`, borderRadius: "10px", padding: "14px" }}>
                    <p style={{ color: colors.textMuted, fontSize: "12px", margin: "0 0 6px", textTransform: "uppercase" }}>Location</p>
                    <p style={{ color: colors.textMain, fontSize: "14px", fontWeight: "700", lineHeight: "1.5", margin: 0 }}>{selectedEvent.location || "No location"}</p>
                  </div>
                  <div style={{ backgroundColor: colors.panelBg, border: `1px solid ${colors.border}`, borderRadius: "10px", padding: "14px" }}>
                    <p style={{ color: colors.textMuted, fontSize: "12px", margin: "0 0 6px", textTransform: "uppercase" }}>Organizer</p>
                    <p style={{ color: colors.textMain, fontSize: "14px", fontWeight: "700", lineHeight: "1.5", margin: "0 0 4px" }}>{selectedEvent.organizer_name || `Organizer #${selectedEvent.organizer_id}`}</p>
                    {selectedEvent.organizer_email && (
                      <p style={{ color: colors.textMuted, fontSize: "12px", lineHeight: "1.5", margin: 0 }}>{selectedEvent.organizer_email}</p>
                    )}
                  </div>
                  <div style={{ backgroundColor: colors.panelBg, border: `1px solid ${colors.border}`, borderRadius: "10px", padding: "14px" }}>
                    <p style={{ color: colors.textMuted, fontSize: "12px", margin: "0 0 6px", textTransform: "uppercase" }}>Event ID</p>
                    <p style={{ color: colors.textMain, fontSize: "14px", fontWeight: "700", margin: 0 }}>#{selectedEvent.id}</p>
                  </div>
                </div>

                <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "10px", marginBottom: "18px" }}>
                  <div style={{ padding: "14px", borderRadius: "10px", backgroundColor: "rgba(148,163,184,0.1)", border: `1px solid ${colors.border}` }}>
                    <p style={{ color: colors.textMuted, fontSize: "11px", margin: "0 0 5px", textTransform: "uppercase" }}>Capacity</p>
                    <p style={{ color: colors.textMain, fontSize: "20px", fontWeight: "800", margin: 0 }}>{selectedEvent.capacity ?? "Unlimited"}</p>
                  </div>
                  <div style={{ padding: "14px", borderRadius: "10px", backgroundColor: "rgba(99,102,241,0.1)", border: "1px solid rgba(99,102,241,0.25)" }}>
                    <p style={{ color: colors.textMuted, fontSize: "11px", margin: "0 0 5px", textTransform: "uppercase" }}>Reserved</p>
                    <p style={{ color: colors.accent, fontSize: "20px", fontWeight: "800", margin: 0 }}>{selectedEvent.going_count || 0}</p>
                  </div>
                  <div style={{ padding: "14px", borderRadius: "10px", backgroundColor: "rgba(16,185,129,0.1)", border: "1px solid rgba(16,185,129,0.25)" }}>
                    <p style={{ color: colors.textMuted, fontSize: "11px", margin: "0 0 5px", textTransform: "uppercase" }}>Free</p>
                    <p style={{ color: colors.green, fontSize: "20px", fontWeight: "800", margin: 0 }}>{selectedEvent.spots_left ?? "Open"}</p>
                  </div>
                </div>

                {rsvpMsg.id === selectedEvent.id && (
                  <div style={{ marginBottom: "16px", padding: "11px 14px", backgroundColor: rsvpMsg.type === "success" ? "rgba(16,185,129,0.1)" : "rgba(245,158,11,0.1)", border: `1px solid ${rsvpMsg.type === "success" ? "rgba(16,185,129,0.3)" : "rgba(245,158,11,0.3)"}`, borderRadius: "8px", color: rsvpMsg.type === "success" ? colors.green : colors.warning, fontSize: "13px", fontWeight: "700" }}>
                    {rsvpMsg.msg}
                  </div>
                )}

                <div style={{ display: "flex", gap: "10px", flexWrap: "wrap" }}>
                  <button
                    type="button"
                    onClick={() => setSelectedEventId(null)}
                    style={{ flex: "1 1 160px", padding: "12px", backgroundColor: "transparent", color: colors.textMain, border: `1px solid ${colors.border}`, borderRadius: "10px", fontSize: "14px", fontWeight: "700", cursor: "pointer" }}
                  >
                    Close
                  </button>
                  <button
                    type="button"
                    onClick={() => selectedIsRsvped ? handleCancelRSVP(selectedEvent.id) : handleRSVP(selectedEvent.id)}
                    disabled={selectedIsDisabled}
                    style={{
                      flex: "2 1 260px",
                      padding: "12px",
                      backgroundColor: selectedIsUnavailable ? "rgba(148,163,184,0.1)" : selectedIsRsvped ? "rgba(239,68,68,0.12)" : token ? colors.accent : "transparent",
                      color: selectedIsUnavailable ? colors.textMuted : selectedIsRsvped ? colors.error : token ? "#fff" : colors.accent,
                      border: selectedIsUnavailable ? `1px solid ${colors.border}` : selectedIsRsvped ? `1px solid ${colors.error}` : token ? "none" : `1px solid ${colors.accent}`,
                      borderRadius: "10px",
                      fontSize: "14px",
                      fontWeight: "800",
                      cursor: selectedIsDisabled ? "not-allowed" : "pointer",
                      boxShadow: token && selectedEvent.status !== "cancelled" && !selectedIsRsvped && !selectedIsFull ? "0 4px 14px rgba(99,102,241,0.4)" : "none",
                    }}
                  >
                    {getRsvpButtonText(selectedEvent)}
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
