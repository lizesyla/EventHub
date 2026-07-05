import { Link } from "react-router-dom"
import { useEffect, useState } from "react"
import { CalendarDays, Info, MapPin, Ticket } from "lucide-react"
import ConfirmModal from "../components/ConfirmModal"
import { API_BASE_URL } from "../config/api";

const colors = {
  bgDark: "#0f172a",
  cardBg: "#1e293b",
  textMain: "#ffffff",
  textMuted: "#94a3b8",
  accent: "#6366f1",
  border: "#334155",
  green: "#10b981",
  error: "#ef4444",
  warning: "#f59e0b",
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

function formatDate(value) {
  if (!value) return "No date"
  return new Date(value).toLocaleString("en-US", {
    dateStyle: "medium",
    timeStyle: "short",
  })
}

function reservationRatio(event) {
  const reserved = Number(event.going_count) || 0
  const capacity = Number(event.capacity) || 0
  return `${reserved}/${capacity}`
}

function applyReservationCount(event, data) {
  const hasServerCount = Number.isFinite(Number(data.spots_taken))
  if (!hasServerCount) return event

  const newGoingCount = Number(data.spots_taken)
  const newCapacity = data.capacity ?? event.capacity
  const newSpotsLeft = data.spots_left ?? Math.max((Number(newCapacity) || 0) - newGoingCount, 0)

  return {
    ...event,
    going_count: newGoingCount,
    capacity: newCapacity,
    spots_left: newSpotsLeft,
    is_full: newCapacity != null ? newGoingCount >= Number(newCapacity) : false,
  }
}

function EventBanner({ event }) {
  const [hasError, setHasError] = useState(false)

  if (event.banner_url && !hasError) {
    return (
      <img
        src={event.banner_url}
        alt={`${event.title} banner`}
        onError={() => setHasError(true)}
        style={{ width: "100%", height: "200px", objectFit: "cover", display: "block" }}
      />
    )
  }

  return (
    <div style={{ width: "100%", height: "200px", background: "linear-gradient(135deg, #4f46e5, #0f766e)", display: "flex", alignItems: "center", justifyContent: "center", color: "#dbeafe" }}>
      <CalendarDays size={56} strokeWidth={1.6} />
    </div>
  )
}

export default function Events() {
  const [events, setEvents] = useState([])
  const [loading, setLoading] = useState(true)
  const [reservationMsg, setReservationMsg] = useState({ id: null, msg: "", type: "" })
  const [reservationLoading, setReservationLoading] = useState(null)
  const [cancelTarget, setCancelTarget] = useState(null)
  const [selectedEvent, setSelectedEvent] = useState(null)
  const [waitlistMsg, setWaitlistMsg] = useState({ id: null, position: null })
  const token = localStorage.getItem("token")
  const role = parseRole()

  useEffect(() => {
    const headers = token ? { Authorization: `Bearer ${token}` } : {}
    fetch(`${API_BASE_URL}/api/events`, { headers })
      .then(res => res.json())
      .then(data => {
        setEvents(Array.isArray(data) ? data : [])
        setLoading(false)
      })
      .catch(() => setLoading(false))
  }, [token])

  useEffect(() => {
  if (!token || events.length === 0) return
  events.forEach(async (event) => {
    try {
      const res = await fetch(`${API_BASE_URL}/api/events/${event.id}/waitlist-status`, {
        headers: { Authorization: `Bearer ${token}` },
      })
      const data = await res.json().catch(() => ({}))
      if (res.ok && data.on_waitlist) {
        setWaitlistMsg(prev => 
          prev.id === event.id ? prev : { id: event.id, position: data.waitlist_position }
        )
      }
    } catch {}
  })
}, [events, token])

  function showMessage(eventId, msg, type = "success") {
    setReservationMsg({ id: eventId, msg, type })
    setTimeout(() => setReservationMsg({ id: null, msg: "", type: "" }), 2800)
  }

  function patchEvent(eventId, updater) {
    setEvents(prev => prev.map(event => event.id === eventId ? updater(event) : event))
    setSelectedEvent(prev => prev && prev.id === eventId ? updater(prev) : prev)
  }

  async function handleReservation(eventId, alreadyReserved) {
    if (!token) {
      showMessage(eventId, "Please sign in to reserve this event.", "warn")
      return
    }

    setReservationLoading(eventId)
    try {
      const res = await fetch(`${API_BASE_URL}/api/events/${eventId}/rsvp`, {
        method: alreadyReserved ? "DELETE" : "POST",
        headers: { Authorization: `Bearer ${token}` },
      })
      const data = await res.json().catch(() => ({}))

      if (res.ok) {
        if (data.waitlist) {
          setWaitlistMsg({ id: eventId, position: data.waitlist_position })
          showMessage(eventId, `Added to waitlist — position #${data.waitlist_position}`, "warn")
        } else {
          patchEvent(eventId, event => {
            const fallbackCount = alreadyReserved
              ? Math.max((Number(event.going_count) || 0) - 1, 0)
              : (Number(event.going_count) || 0) + 1
            const newGoingCount = Number.isFinite(Number(data.spots_taken))
              ? Number(data.spots_taken)
              : fallbackCount
            const newCapacity = data.capacity ?? event.capacity
            const newSpotsLeft = data.spots_left ?? Math.max((Number(newCapacity) || 0) - newGoingCount, 0)

            return {
              ...event,
              going_count: newGoingCount,
              capacity: newCapacity,
              spots_left: newSpotsLeft,
              is_full: newCapacity != null ? newGoingCount >= Number(newCapacity) : false,
              user_has_rsvped: !alreadyReserved,
            }
          })
          showMessage(eventId, alreadyReserved ? "Reservation cancelled." : "Reservation confirmed.")
        }
      } else {
        patchEvent(eventId, event => applyReservationCount(event, data))
        showMessage(eventId, data.detail || "Could not complete this reservation.", "warn")
      }
    } catch {
      showMessage(eventId, "Could not connect to the server.", "warn")
    } finally {
        setReservationLoading(null)
        setCancelTarget(null)
        const headers = token ? { Authorization: `Bearer ${token}` } : {}
        fetch(`${API_BASE_URL}/api/events`, { headers })
          .then(res => res.json())
          .then(data => setEvents(Array.isArray(data) ? data : []))
          .catch(() => {})
    }
  }

  async function handleWaitlist(eventId) {
    if (!token) {
      showMessage(eventId, "Please sign in to join the waitlist.", "warn")
      return
    }
    setReservationLoading(eventId)
    try {
      const res = await fetch(`${API_BASE_URL}/api/events/${eventId}/rsvp`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
      })
      const data = await res.json().catch(() => ({}))
      if (res.ok && data.waitlist) {
        setWaitlistMsg({ id: eventId, position: data.waitlist_position })
        showMessage(eventId, `Added to waitlist — position #${data.waitlist_position}`, "warn")
      } else {
        showMessage(eventId, data.detail || "Could not join waitlist.", "warn")
      }
    } catch {
      showMessage(eventId, "Could not connect to the server.", "warn")
    } finally {
      setReservationLoading(null)
    }
  }

  async function handleLeaveWaitlist(eventId) {
  setReservationLoading(eventId)
  try {
    const res = await fetch(`${API_BASE_URL}/api/events/${eventId}/waitlist/leave`, {
      method: "DELETE",
      headers: { Authorization: `Bearer ${token}` },
    })
    const data = await res.json().catch(() => ({}))
    if (res.ok) {
      setWaitlistMsg({ id: null, position: null })
      showMessage(eventId, "You have left the waitlist.", "success")
    } else {
      showMessage(eventId, data.detail || "Could not leave waitlist.", "warn")
    }
  } catch {
    showMessage(eventId, "Could not connect to the server.", "warn")
  } finally {
    setReservationLoading(null)
  }
}

  function renderReservationButton(event, compact = false) {
    const fullyBooked = event.capacity != null && event.is_full && !event.user_has_rsvped
    const onWaitlist = waitlistMsg.id === event.id
    const disabled = event.status === "cancelled" || reservationLoading === event.id

    const label = reservationLoading === event.id
      ? "Processing..."
      : event.status === "cancelled"
        ? "Event Cancelled"
        : event.user_has_rsvped
          ? "Cancel Reservation"
          : onWaitlist
            ? `Leave Waitlist  #${waitlistMsg.position}`
            : fullyBooked
              ? "Join Waitlist"
              : token ? "Reserve Spot" : "Sign in to Reserve"

    const bgColor = disabled
      ? "rgba(148,163,184,0.1)"
      : event.user_has_rsvped
        ? "transparent"
        : onWaitlist || fullyBooked
          ? "rgba(245,158,11,0.1)"
          : token ? colors.accent : "transparent"

    const textColor = disabled
      ? colors.textMuted
      : event.user_has_rsvped
        ? colors.error
        : onWaitlist || fullyBooked
          ? colors.warning
          : token ? "#fff" : colors.accent

    return (
      <button
        type="button"
        onClick={() => {
          if (event.user_has_rsvped) setCancelTarget(event)
          else if (onWaitlist) handleLeaveWaitlist(event.id)
          else if (fullyBooked) handleWaitlist(event.id)
          else handleReservation(event.id, false)
        }}
        disabled={disabled}
        style={{
          width: compact ? "auto" : "100%",
          padding: compact ? "11px 16px" : "12px",
          backgroundColor: bgColor,
          color: textColor,
          border: event.user_has_rsvped
            ? `1px solid ${colors.error}`
            : onWaitlist || fullyBooked
              ? `1px solid rgba(245,158,11,0.4)`
              : disabled
                ? `1px solid ${colors.border}`
                : token ? "none" : `1px solid ${colors.accent}`,
          borderRadius: "10px",
          fontSize: "14px",
          fontWeight: "700",
          cursor: disabled || onWaitlist ? "not-allowed" : "pointer",
          boxShadow: token && !disabled && !event.user_has_rsvped && !fullyBooked ? "0 4px 14px rgba(99,102,241,0.4)" : "none",
        }}
      >
        {label}
      </button>
    )
  }

  return (
    <div style={{ backgroundColor: colors.bgDark, minHeight: "100vh", padding: "60px 20px", fontFamily: "'Inter', sans-serif" }}>
      <div style={{ maxWidth: "1200px", margin: "0 auto" }}>
        <div style={{ marginBottom: "48px" }}>
          <p style={{ color: colors.accent, fontSize: "12px", fontWeight: "700", letterSpacing: "3px", textTransform: "uppercase", margin: "0 0 12px" }}>DISCOVER</p>
          <h1 style={{ fontSize: "40px", fontWeight: "800", color: colors.textMain, margin: "0 0 12px" }}>
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
          <div style={{ textAlign: "center", padding: "80px", backgroundColor: colors.cardBg, borderRadius: "16px", border: `1px solid ${colors.border}` }}>
            <CalendarDays size={46} color={colors.textMuted} style={{ marginBottom: "16px" }} />
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
            {events.map(event => (
              <article key={event.id} style={{ backgroundColor: colors.cardBg, borderRadius: "16px", overflow: "hidden", border: `1px solid ${colors.border}` }}>
                <EventBanner event={event} />

                <div style={{ padding: "24px" }}>
                  {event.status && event.status !== "upcoming" && (
                    <span style={{ fontSize: "11px", padding: "3px 10px", borderRadius: "20px", backgroundColor: event.status === "cancelled" ? "rgba(239,68,68,0.15)" : "rgba(148,163,184,0.15)", color: event.status === "cancelled" ? colors.error : colors.textMuted, fontWeight: "700", display: "inline-block", marginBottom: "10px", textTransform: "uppercase" }}>
                      {event.status}
                    </span>
                  )}

                  <h3 style={{ color: colors.textMain, fontSize: "18px", fontWeight: "700", margin: "0 0 12px" }}>{event.title}</h3>

                  <p style={{ display: "flex", alignItems: "center", gap: "7px", color: colors.textMuted, fontSize: "13px", margin: "0 0 6px" }}>
                    <MapPin size={14} /> {event.location}
                  </p>
                  <p style={{ display: "flex", alignItems: "center", gap: "7px", color: colors.textMuted, fontSize: "13px", margin: "0 0 6px" }}>
                    <CalendarDays size={14} /> {formatDate(event.date_time)}
                  </p>

                  <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "8px", marginTop: "16px", marginBottom: "18px", borderTop: `1px solid ${colors.border}`, borderBottom: `1px solid ${colors.border}`, padding: "12px 0" }}>
                    <div>
                      <p style={{ color: colors.textMuted, fontSize: "11px", margin: "0 0 4px", textTransform: "uppercase" }}>Capacity</p>
                      <p style={{ color: colors.textMain, fontSize: "18px", fontWeight: "800", margin: 0 }}>{event.capacity ?? 0}</p>
                    </div>
                    <div>
                      <p style={{ color: colors.textMuted, fontSize: "11px", margin: "0 0 4px", textTransform: "uppercase" }}>Reserved</p>
                      <p style={{ color: colors.accent, fontSize: "18px", fontWeight: "800", margin: 0 }}>{event.going_count || 0}</p>
                    </div>
                    <div>
                      <p style={{ color: colors.textMuted, fontSize: "11px", margin: "0 0 4px", textTransform: "uppercase" }}>Reservations</p>
                      <p style={{ color: event.is_full ? colors.error : colors.green, fontSize: "18px", fontWeight: "800", margin: 0 }}>{reservationRatio(event)}</p>
                    </div>
                  </div>

                  {event.description && (
                    <p style={{ color: colors.textMuted, fontSize: "14px", margin: "12px 0 0", lineHeight: "1.6", display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical", overflow: "hidden" }}>
                      {event.description}
                    </p>
                  )}

                  {reservationMsg.id === event.id && (
                    <div style={{ marginTop: "12px", padding: "10px 14px", backgroundColor: reservationMsg.type === "warn" ? "rgba(245,158,11,0.1)" : "rgba(16,185,129,0.1)", border: `1px solid ${reservationMsg.type === "warn" ? "rgba(245,158,11,0.3)" : "rgba(16,185,129,0.3)"}`, borderRadius: "8px", color: reservationMsg.type === "warn" ? colors.warning : colors.green, fontSize: "13px", fontWeight: "600" }}>
                      {reservationMsg.msg}
                    </div>
                  )}

                  <div style={{ display: "grid", gridTemplateColumns: role !== "admin" ? "1fr 1.2fr" : "1fr", gap: "10px", marginTop: "20px" }}>
                    <button
                      type="button"
                      onClick={() => setSelectedEvent(event)}
                      style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: "7px", padding: "12px", backgroundColor: "transparent", color: colors.textMain, border: `1px solid ${colors.border}`, borderRadius: "10px", fontSize: "14px", fontWeight: "700", cursor: "pointer" }}
                    >
                      <Info size={15} /> View Details
                    </button>
                    {role !== "admin" && renderReservationButton(event)}
                  </div>
                </div>
              </article>
            ))}
          </div>
        )}
      </div>

      {selectedEvent && (
        <div role="dialog" aria-modal="true" onClick={() => setSelectedEvent(null)} style={{ position: "fixed", inset: 0, zIndex: 1500, backgroundColor: "rgba(0,0,0,0.72)", display: "flex", alignItems: "center", justifyContent: "center", padding: "20px" }}>
          <div onClick={event => event.stopPropagation()} style={{ width: "100%", maxWidth: "620px", maxHeight: "90vh", overflowY: "auto", backgroundColor: colors.cardBg, border: `1px solid ${colors.border}`, borderRadius: "16px", boxShadow: "0 24px 70px rgba(0,0,0,0.45)" }}>
            <EventBanner event={selectedEvent} />
            <div style={{ padding: "24px" }}>
              <h2 style={{ color: colors.textMain, fontSize: "24px", fontWeight: "800", margin: "0 0 12px" }}>{selectedEvent.title}</h2>
              <div style={{ display: "grid", gap: "8px", marginBottom: "18px" }}>
                <p style={{ display: "flex", alignItems: "center", gap: "8px", color: colors.textMuted, fontSize: "14px", margin: 0 }}><MapPin size={15} /> {selectedEvent.location}</p>
                <p style={{ display: "flex", alignItems: "center", gap: "8px", color: colors.textMuted, fontSize: "14px", margin: 0 }}><CalendarDays size={15} /> {formatDate(selectedEvent.date_time)}</p>
              </div>
              <p style={{ color: colors.textMuted, fontSize: "15px", lineHeight: "1.7", margin: "0 0 22px" }}>
                {selectedEvent.description || "No description provided."}
              </p>

              <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "10px", marginBottom: "22px" }}>
                {[
                  ["Reservations", reservationRatio(selectedEvent), colors.accent],
                  ["Reserved", selectedEvent.going_count || 0, colors.green],
                  ["Available", selectedEvent.spots_left ?? 0, selectedEvent.is_full ? colors.error : colors.green],
                ].map(([label, value, color]) => (
                  <div key={label} style={{ backgroundColor: "#0f172a", border: `1px solid ${colors.border}`, borderRadius: "10px", padding: "14px" }}>
                    <p style={{ color: colors.textMuted, fontSize: "11px", textTransform: "uppercase", margin: "0 0 5px" }}>{label}</p>
                    <p style={{ color, fontSize: "20px", fontWeight: "800", margin: 0 }}>{value}</p>
                  </div>
                ))}
              </div>

              <div style={{ display: "flex", justifyContent: "space-between", gap: "10px", flexWrap: "wrap" }}>
                <button type="button" onClick={() => setSelectedEvent(null)} style={{ padding: "11px 16px", backgroundColor: "transparent", color: colors.textMuted, border: `1px solid ${colors.border}`, borderRadius: "10px", fontSize: "14px", fontWeight: "700", cursor: "pointer" }}>
                  Close
                </button>
                {role !== "admin" && (
                  <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                    <Ticket size={18} color={colors.textMuted} />
                    {renderReservationButton(selectedEvent, true)}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      <ConfirmModal
        open={Boolean(cancelTarget)}
        title="Cancel reservation?"
        message={`Are you sure you want to cancel your reservation for "${cancelTarget?.title}"?`}
        confirmLabel="Cancel Reservation"
        tone="warning"
        loading={reservationLoading === cancelTarget?.id}
        onCancel={() => setCancelTarget(null)}
        onConfirm={() => cancelTarget && handleReservation(cancelTarget.id, true)}
      />
    </div>
  )
}