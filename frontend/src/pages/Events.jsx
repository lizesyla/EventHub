import { Link } from "react-router-dom"
import { useEffect, useState } from "react"
import ConfirmModal from "../components/ConfirmModal"

const colors = {
  bgDark: "#0f172a",
  cardBg: "#1e293b",
  textMain: "#ffffff",
  textMuted: "#94a3b8",
  accent: "#6366f1",
  border: "#334155",
  green: "#10b981",
  error: "#ef4444",
}

function parseRole() {
  try {
    const token = localStorage.getItem("token")
    if (!token) return null
    const payload = JSON.parse(atob(token.split(".")[1]))
    return payload.role || null
  } catch {
    return null
  }
}

export default function Events() {
  const [events, setEvents] = useState([])
  const [loading, setLoading] = useState(true)
  const [rsvpMsg, setRsvpMsg] = useState({ id: null, msg: "", type: "" })
  const [rsvpLoading, setRsvpLoading] = useState(null)
  const [cancelRsvpEvent, setCancelRsvpEvent] = useState(null)
  const [selectedEvent, setSelectedEvent] = useState(null)
  const token = localStorage.getItem("token")
  const role = parseRole()

  useEffect(() => {
    const headers = token ? { Authorization: `Bearer ${token}` } : {}
    fetch("http://localhost:8000/api/events", { headers })
      .then(response => response.json())
      .then(data => setEvents(Array.isArray(data) ? data : []))
      .catch(() => setEvents([]))
      .finally(() => setLoading(false))
  }, [token])

  async function handleRSVP(eventId, alreadyRsvped) {
    if (!token) {
      setRsvpMsg({ id: eventId, msg: "Please sign in to make a reservation for this event.", type: "warn" })
      setTimeout(() => setRsvpMsg({ id: null, msg: "", type: "" }), 3000)
      return
    }

    setRsvpLoading(eventId)
    try {
      const res = await fetch(`http://localhost:8000/api/events/${eventId}/rsvp`, {
        method: alreadyRsvped ? "DELETE" : "POST",
        headers: { Authorization: `Bearer ${token}` },
      })
      const data = await res.json().catch(() => ({}))

      if (res.ok) {
        const applyReservationUpdate = event => {
          const fallbackCount = alreadyRsvped
            ? Math.max((Number(event.going_count) || 0) - 1, 0)
            : (Number(event.going_count) || 0) + 1
          const newGoingCount = Number.isFinite(Number(data.spots_taken))
            ? Number(data.spots_taken)
            : fallbackCount
          const newCapacity = data.capacity ?? event.capacity
          const newSpotsLeft = data.spots_left ?? (
            newCapacity != null ? Math.max(newCapacity - newGoingCount, 0) : null
          )

          return {
            ...event,
            going_count: newGoingCount,
            capacity: newCapacity,
            spots_left: newSpotsLeft,
            is_full: newCapacity != null ? newGoingCount >= newCapacity : false,
            user_has_rsvped: !alreadyRsvped,
          }
        }

        setEvents(prev => prev.map(event => {
          if (event.id !== eventId) return event
          return applyReservationUpdate(event)
        }))
        setSelectedEvent(prev => prev && prev.id === eventId ? applyReservationUpdate(prev) : prev)
        setRsvpMsg({ id: eventId, msg: alreadyRsvped ? "Reservation cancelled." : "Reservation confirmed.", type: "success" })
      } else {
        setRsvpMsg({ id: eventId, msg: data.detail || "Something went wrong.", type: "warn" })
      }
    } catch {
      setRsvpMsg({ id: eventId, msg: "Could not connect to the server.", type: "warn" })
    } finally {
      setRsvpLoading(null)
      setTimeout(() => setRsvpMsg({ id: null, msg: "", type: "" }), 2500)
    }
  }

  function requestRSVP(event) {
    if (event.user_has_rsvped) {
      setCancelRsvpEvent(event)
      return
    }

    handleRSVP(event.id, false)
  }

  function confirmCancelRSVP() {
    const event = cancelRsvpEvent
    if (!event) return

    setCancelRsvpEvent(null)
    handleRSVP(event.id, true)
  }

  function reservationRatio(event) {
    const going = Number(event.going_count) || 0
    const capacity = Number(event.capacity) || 0
    return `${going}/${capacity}`
  }

  function availableSpots(event) {
    const capacity = Number(event.capacity) || 0
    const going = Number(event.going_count) || 0
    return Math.max(capacity - going, 0)
  }

  function reserveButtonLabel(event, fullyBooked) {
    if (rsvpLoading === event.id) return "Processing..."
    if (event.status === "cancelled") return "Event Cancelled"
    if (event.user_has_rsvped) return "Cancel Reservation"
    if (fullyBooked) return "Fully Booked"
    return token ? "Reserve Spot" : "Sign in to Reserve"
  }

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
            <h3 style={{ color: colors.textMain, fontSize: "22px", fontWeight: "700", margin: "0 0 12px" }}>No events yet</h3>
            <p style={{ color: colors.textMuted, margin: "0 0 28px" }}>Check back soon. Events will appear here.</p>
            {!token && (
              <Link to="/register" style={{ padding: "13px 28px", backgroundColor: colors.accent, color: "#fff", borderRadius: "10px", textDecoration: "none", fontSize: "14px", fontWeight: "600" }}>
                Create an account
              </Link>
            )}
          </div>
        ) : (
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(340px, 1fr))", gap: "24px" }}>
            {events.map(event => {
              const fullyBooked = event.capacity != null && event.is_full && !event.user_has_rsvped
              const disabled = event.status === "cancelled" || rsvpLoading === event.id || fullyBooked

              return (
                <div
                  key={event.id}
                  style={{ backgroundColor: colors.cardBg, borderRadius: "20px", overflow: "hidden", border: `1px solid ${colors.border}`, transition: "transform 0.3s ease, box-shadow 0.3s ease" }}
                  onMouseEnter={e => { e.currentTarget.style.transform = "translateY(-6px)"; e.currentTarget.style.boxShadow = "0 20px 60px rgba(99,102,241,0.15)" }}
                  onMouseLeave={e => { e.currentTarget.style.transform = "translateY(0)"; e.currentTarget.style.boxShadow = "none" }}
                >
                  {event.banner_url ? (
                    <img src={event.banner_url} alt="Event banner" style={{ width: "100%", height: "200px", objectFit: "cover" }} />
                  ) : (
                    <div style={{ width: "100%", height: "200px", background: "linear-gradient(135deg, #4f46e5, #7c3aed)", display: "flex", alignItems: "center", justifyContent: "center", color: "#fff", fontSize: "20px", fontWeight: "800" }}>
                      EventHub
                    </div>
                  )}

                  <div style={{ padding: "24px" }}>
                    {event.status && event.status !== "upcoming" && (
                      <span style={{ fontSize: "11px", padding: "3px 10px", borderRadius: "20px", backgroundColor: event.status === "cancelled" ? "rgba(239,68,68,0.15)" : "rgba(148,163,184,0.15)", color: event.status === "cancelled" ? colors.error : colors.textMuted, fontWeight: "700", display: "inline-block", marginBottom: "10px" }}>
                        {event.status}
                      </span>
                    )}

                    <h3 style={{ color: colors.textMain, fontSize: "18px", fontWeight: "700", margin: "0 0 12px", letterSpacing: "-0.3px" }}>{event.title}</h3>
                    <p style={{ color: colors.textMuted, fontSize: "13px", margin: "0 0 6px" }}>{event.location}</p>
                    <p style={{ color: colors.textMuted, fontSize: "13px", margin: "0 0 6px" }}>
                      {event.date_time ? new Date(event.date_time).toLocaleString("en-US", { dateStyle: "medium", timeStyle: "short" }) : ""}
                    </p>
                    <div style={{
                    display: "grid",
                    gridTemplateColumns: "repeat(3, 1fr)",
                    gap: "8px",
                    margin: "16px 0",
                    borderTop: `1px solid ${colors.border}`,
                    borderBottom: `1px solid ${colors.border}`,
                    padding: "12px 0"
                  }}>
                    <div>
                      <p style={{ color: colors.textMuted, fontSize: "11px", margin: "0 0 4px", textTransform: "uppercase" }}>Reservations</p>
                      <p style={{ color: colors.textMain, fontSize: "18px", fontWeight: "800", margin: 0 }}>{reservationRatio(event)}</p>
                    </div>

                    <div>
                      <p style={{ color: colors.textMuted, fontSize: "11px", margin: "0 0 4px", textTransform: "uppercase" }}>Reserved</p>
                      <p style={{ color: colors.accent, fontSize: "18px", fontWeight: "800", margin: 0 }}>{event.going_count || 0}</p>
                    </div>

                    <div>
                      <p style={{ color: colors.textMuted, fontSize: "11px", margin: "0 0 4px", textTransform: "uppercase" }}>Available</p>
                      <p style={{ color: event.is_full ? colors.error : colors.green, fontSize: "18px", fontWeight: "800", margin: 0 }}>
                        {event.spots_left ?? availableSpots(event)}
                      </p>
                    </div>
                    </div>

                    <p style={{ color: event.is_full ? colors.error : colors.textMuted, fontSize: "13px", margin: "0 0 6px", fontWeight: event.is_full ? "700" : "400" }}>
                      {`${reservationRatio(event)} Reservations${event.is_full ? " - Fully booked" : ""}`}
                    </p>

                    {event.description && (
                      <p style={{ color: colors.textMuted, fontSize: "14px", margin: "12px 0 0", lineHeight: "1.6", display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical", overflow: "hidden" }}>
                        {event.description}
                      </p>
                    )}

                    {rsvpMsg.id === event.id && (
                      <div style={{ marginTop: "12px", padding: "10px 14px", backgroundColor: rsvpMsg.type === "warn" ? "rgba(245,158,11,0.1)" : "rgba(16,185,129,0.1)", border: `1px solid ${rsvpMsg.type === "warn" ? "rgba(245,158,11,0.3)" : "rgba(16,185,129,0.3)"}`, borderRadius: "8px", color: rsvpMsg.type === "warn" ? "#f59e0b" : colors.green, fontSize: "13px", fontWeight: "600" }}>
                        {rsvpMsg.msg}
                      </div>
                    )}

                    <div style={{ display: "flex", gap: "10px", marginTop: "20px" }}>
                      <button
                        type="button"
                        onClick={() => setSelectedEvent(event)}
                        style={{
                          flex: role === "admin" ? "1 1 100%" : "1",
                          padding: "12px",
                          backgroundColor: "transparent",
                          color: colors.accent,
                          border: `1px solid ${colors.accent}`,
                          borderRadius: "10px",
                          fontSize: "14px",
                          fontWeight: "700",
                          cursor: "pointer",
                        }}
                      >
                        View Details
                      </button>

                      {role !== "admin" && (
                      <button
                        onClick={() => requestRSVP(event)}
                        disabled={disabled}
                        style={{
                          width: "100%",
                          flex: "1",
                          padding: "12px",
                          backgroundColor: disabled
                            ? "rgba(148,163,184,0.1)"
                            : event.user_has_rsvped
                              ? "transparent"
                              : token ? colors.accent : "transparent",
                          color: disabled
                            ? colors.textMuted
                            : event.user_has_rsvped
                              ? colors.error
                              : token ? "#fff" : colors.accent,
                          border: event.user_has_rsvped
                            ? `1px solid ${colors.error}`
                            : disabled
                              ? `1px solid ${colors.border}`
                              : token ? "none" : `1px solid ${colors.accent}`,
                          borderRadius: "10px",
                          fontSize: "14px",
                          fontWeight: "700",
                          cursor: disabled ? "not-allowed" : "pointer",
                          boxShadow: token && !disabled && !event.user_has_rsvped ? "0 4px 14px rgba(99,102,241,0.4)" : "none",
                          transition: "all 0.2s ease",
                        }}
                      >
                        {reserveButtonLabel(event, fullyBooked)}
                      </button>
                      )}
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>

      <ConfirmModal
        open={Boolean(cancelRsvpEvent)}
        title="Cancel Reservation?"
        message={`Are you sure you want to cancel your reservation for "${cancelRsvpEvent?.title}"? Your reservation will be released.`}
        confirmLabel="Cancel Reservation"
        tone="danger"
        loading={rsvpLoading === cancelRsvpEvent?.id}
        onCancel={() => setCancelRsvpEvent(null)}
        onConfirm={confirmCancelRSVP}
      />

      {selectedEvent && (
        <div
          onClick={() => setSelectedEvent(null)}
          style={{ position: "fixed", inset: 0, backgroundColor: "rgba(0,0,0,0.72)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 1200, padding: "20px" }}
        >
          <div
            onClick={event => event.stopPropagation()}
            style={{ backgroundColor: colors.cardBg, border: `1px solid ${colors.border}`, borderRadius: "16px", width: "100%", maxWidth: "560px", overflow: "hidden" }}
          >
            {selectedEvent.banner_url && (
              <img src={selectedEvent.banner_url} alt="Event banner" style={{ width: "100%", height: "190px", objectFit: "cover" }} />
            )}
            <div style={{ padding: "24px" }}>
              <div style={{ display: "flex", justifyContent: "space-between", gap: "16px", alignItems: "flex-start", marginBottom: "14px" }}>
                <div>
                  <p style={{ color: colors.accent, fontSize: "11px", fontWeight: "700", letterSpacing: "2px", textTransform: "uppercase", margin: "0 0 6px" }}>EVENT DETAILS</p>
                  <h2 style={{ color: colors.textMain, fontSize: "24px", margin: 0 }}>{selectedEvent.title}</h2>
                </div>
                <button onClick={() => setSelectedEvent(null)} style={{ background: "transparent", border: "none", color: colors.textMuted, fontSize: "20px", cursor: "pointer" }}>x</button>
              </div>

              <p style={{ color: colors.textMuted, lineHeight: 1.6, margin: "0 0 18px" }}>
                {selectedEvent.description || "No description provided."}
              </p>

              <div style={{ display: "grid", gridTemplateColumns: "repeat(2, minmax(0, 1fr))", gap: "12px", marginBottom: "20px" }}>
                {[
                  ["Date", selectedEvent.date_time ? new Date(selectedEvent.date_time).toLocaleString("en-US", { dateStyle: "medium", timeStyle: "short" }) : "No date"],
                  ["Location", selectedEvent.location || "No location"],

                  ["Reservations", reservationRatio(selectedEvent)],
                  ["Spots left", selectedEvent.spots_left ?? availableSpots(selectedEvent)],
                ].map(([label, value]) => (
                  <div key={label} style={{ backgroundColor: colors.bgDark, border: `1px solid ${colors.border}`, borderRadius: "10px", padding: "12px" }}>
                    <p style={{ color: colors.textMuted, fontSize: "11px", margin: "0 0 5px", textTransform: "uppercase", letterSpacing: "1px" }}>{label}</p>
                    <p style={{ color: colors.textMain, fontSize: "14px", fontWeight: "700", margin: 0 }}>{value}</p>
                  </div>
                ))}
              </div>

              {role !== "admin" && (
                <button
                  onClick={() => requestRSVP(selectedEvent)}
                  disabled={selectedEvent.status === "cancelled" || rsvpLoading === selectedEvent.id || (selectedEvent.capacity != null && selectedEvent.is_full && !selectedEvent.user_has_rsvped)}
                  style={{
                    width: "100%",
                    padding: "12px",
                    backgroundColor: selectedEvent.user_has_rsvped ? "transparent" : colors.accent,
                    color: selectedEvent.user_has_rsvped ? colors.error : "#fff",
                    border: selectedEvent.user_has_rsvped ? `1px solid ${colors.error}` : "none",
                    borderRadius: "10px",
                    fontSize: "14px",
                    fontWeight: "700",
                    cursor: "pointer",
                  }}
                >
                  {reserveButtonLabel(selectedEvent, selectedEvent.capacity != null && selectedEvent.is_full && !selectedEvent.user_has_rsvped)}
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
