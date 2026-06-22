import { useEffect, useState } from "react"
import { Link } from "react-router-dom"
import { CalendarDays, Edit3, MapPin, Users } from "lucide-react"
import ConfirmModal from "../components/ConfirmModal"

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

const inputStyle = {
  width: "100%",
  padding: "11px 12px",
  borderRadius: "8px",
  border: `1px solid ${colors.border}`,
  backgroundColor: colors.inputBg,
  color: colors.textMain,
  fontSize: "14px",
  boxSizing: "border-box",
  outline: "none",
}

function formatDate(value) {
  if (!value) return "No date"
  return new Date(value).toLocaleString("en-US", {
    dateStyle: "medium",
    timeStyle: "short",
  })
}

function toDatetimeLocal(value) {
  if (!value) return ""
  const date = new Date(value)
  const local = new Date(date.getTime() - date.getTimezoneOffset() * 60000)
  return local.toISOString().slice(0, 16)
}

function reservationRatio(event) {
  const reserved = Number(event.going_count) || 0
  const capacity = Number(event.capacity) || 0
  return `${reserved}/${capacity}`
}

function statusStyle(status) {
  if (status === "upcoming") return { bg: "rgba(16,185,129,0.15)", color: colors.green, label: "Active" }
  if (status === "pending") return { bg: "rgba(245,158,11,0.15)", color: colors.warning, label: "Pending Review" }
  if (status === "cancelled") return { bg: "rgba(239,68,68,0.15)", color: colors.error, label: "Cancelled" }
  if (status === "past") return { bg: "rgba(148,163,184,0.15)", color: colors.textMuted, label: "Archived" }
  return { bg: "rgba(148,163,184,0.15)", color: colors.textMuted, label: status || "Draft" }
}

function EventBanner({ event }) {
  const [hasError, setHasError] = useState(false)

  if (event.banner_url && !hasError) {
    return (
      <img
        src={event.banner_url}
        alt={`${event.title} banner`}
        onError={() => setHasError(true)}
        style={{ width: "100%", height: "180px", objectFit: "cover", display: "block" }}
      />
    )
  }

  return (
    <div style={{ width: "100%", height: "180px", background: "linear-gradient(135deg, #4f46e5, #0f766e)", display: "flex", alignItems: "center", justifyContent: "center", color: "#dbeafe", padding: "20px", textAlign: "center" }}>
      <div>
        <CalendarDays size={42} strokeWidth={1.7} />
        <p style={{ fontSize: "12px", fontWeight: "700", letterSpacing: "2px", textTransform: "uppercase", opacity: 0.8, margin: "10px 0 0" }}>Event Banner</p>
      </div>
    </div>
  )
}

export default function MyEvents() {
  const [events, setEvents] = useState([])
  const [loading, setLoading] = useState(true)
  const [message, setMessage] = useState("")
  const [editingId, setEditingId] = useState(null)
  const [editForm, setEditForm] = useState({ title: "", description: "", location: "", date_time: "", capacity: "" })
  const [savingEdit, setSavingEdit] = useState(false)
  const [cancelTarget, setCancelTarget] = useState(null)
  const [archiveTarget, setArchiveTarget] = useState(null)
  const [guestEvent, setGuestEvent] = useState(null)
  const [guests, setGuests] = useState([])
  const [loadingGuests, setLoadingGuests] = useState(false)
  const token = localStorage.getItem("token")

  useEffect(() => {
    fetch("http://localhost:8000/api/events/mine", {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then(res => res.json())
      .then(data => {
        setEvents(Array.isArray(data) ? data : [])
        setLoading(false)
      })
      .catch(() => setLoading(false))
  }, [token])

  function showMessage(text) {
    setMessage(text)
    setTimeout(() => setMessage(""), 3200)
  }

  function startEdit(event) {
    setEditingId(event.id)
    setEditForm({
      title: event.title || "",
      description: event.description || "",
      location: event.location || "",
      date_time: toDatetimeLocal(event.date_time),
      capacity: event.capacity == null ? "" : String(event.capacity),
    })
  }

  async function saveEdit(event) {
    const capacityNumber = Number(editForm.capacity)
    if (!editForm.title.trim() || editForm.title.trim().length < 3) {
      showMessage("Title must be at least 3 characters.")
      return
    }
    if (!editForm.location.trim()) {
      showMessage("Location is required.")
      return
    }
    if (!editForm.date_time) {
      showMessage("Date and time are required.")
      return
    }
    if (!editForm.capacity || !Number.isInteger(capacityNumber) || capacityNumber < 1) {
      showMessage("Capacity must be a whole number of at least 1.")
      return
    }
    if (capacityNumber < (Number(event.going_count) || 0)) {
      showMessage("Capacity cannot be lower than the current reservation count.")
      return
    }

    setSavingEdit(true)
    const formData = new FormData()
    formData.append("title", editForm.title.trim())
    formData.append("description", editForm.description)
    formData.append("location", editForm.location.trim())
    formData.append("date_time", editForm.date_time)
    formData.append("capacity", editForm.capacity)

    try {
      const res = await fetch(`http://localhost:8000/api/events/${event.id}`, {
        method: "PUT",
        headers: { Authorization: `Bearer ${token}` },
        body: formData,
      })
      const data = await res.json().catch(() => ({}))

      if (res.ok) {
        const updated = data.event || {
          ...event,
          ...editForm,
          capacity: capacityNumber,
          status: data.requires_reapproval ? "pending" : event.status,
          pending_reason: data.requires_reapproval ? "edited" : event.pending_reason,
        }
        setEvents(prev => prev.map(item => item.id === event.id ? updated : item))
        setEditingId(null)
        showMessage(data.requires_reapproval ? "Event updated and sent for admin review." : "Event updated successfully.")
      } else {
        showMessage(data.detail || "Could not update event.")
      }
    } catch {
      showMessage("Could not connect to the server.")
    } finally {
      setSavingEdit(false)
    }
  }

  async function cancelEvent() {
    if (!cancelTarget) return
    try {
      const res = await fetch(`http://localhost:8000/api/events/${cancelTarget.id}/cancel`, {
        method: "PATCH",
        headers: { Authorization: `Bearer ${token}` },
      })
      const data = await res.json().catch(() => ({}))

      if (res.ok) {
        setEvents(prev => prev.map(event =>
          event.id === cancelTarget.id
            ? { ...event, status: "cancelled", going_count: 0, spots_left: event.capacity ?? 0 }
            : event
        ))
        showMessage(data.message || "Event cancelled successfully.")
      } else {
        showMessage(data.detail || "Could not cancel event.")
      }
    } catch {
      showMessage("Could not connect to the server.")
    } finally {
      setCancelTarget(null)
    }
  }

  async function archiveEvent() {
    if (!archiveTarget) return
    try {
      const res = await fetch(`http://localhost:8000/api/events/${archiveTarget.id}/archive`, {
        method: "PATCH",
        headers: { Authorization: `Bearer ${token}` },
      })
      const data = await res.json().catch(() => ({}))

      if (res.ok) {
        setEvents(prev => prev.map(event =>
          event.id === archiveTarget.id ? { ...event, status: "past" } : event
        ))
        showMessage(data.message || "Event archived successfully.")
      } else {
        showMessage(data.detail || "Could not archive event.")
      }
    } catch {
      showMessage("Could not connect to the server.")
    } finally {
      setArchiveTarget(null)
    }
  }

  async function openGuests(event) {
    setGuestEvent(event)
    setGuests([])
    setLoadingGuests(true)

    try {
      const res = await fetch(`http://localhost:8000/api/events/${event.id}/guests`, {
        headers: { Authorization: `Bearer ${token}` },
      })
      const data = await res.json().catch(() => ({}))
      setGuests(res.ok && Array.isArray(data.guests) ? data.guests : [])
      if (!res.ok) showMessage(data.detail || "Could not load guest list.")
    } catch {
      showMessage("Could not connect to the server.")
    } finally {
      setLoadingGuests(false)
    }
  }

  const totalReserved = events.reduce((sum, event) => sum + (Number(event.going_count) || 0), 0)

  return (
    <div style={{ backgroundColor: colors.bgDark, minHeight: "100vh", padding: "40px 20px", fontFamily: "'Inter', sans-serif" }}>
      <div style={{ maxWidth: "1200px", margin: "0 auto" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "40px", flexWrap: "wrap", gap: "16px" }}>
          <div>
            <p style={{ color: colors.accent, fontSize: "12px", fontWeight: "700", letterSpacing: "3px", textTransform: "uppercase", margin: "0 0 10px" }}>MY EVENTS</p>
            <h2 style={{ fontSize: "32px", fontWeight: "800", color: colors.textMain, margin: "0 0 8px" }}>My Events</h2>
            <p style={{ color: colors.textMuted, fontSize: "15px", margin: 0 }}>Manage submitted events, capacity, reservations, and guest lists.</p>
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
            { label: "Pending Review", value: events.filter(event => event.status === "pending").length, color: colors.warning },
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
            <CalendarDays size={42} color={colors.textMuted} style={{ marginBottom: "16px" }} />
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
              const isEditing = editingId === event.id

              return (
                <article key={event.id} style={{ backgroundColor: colors.cardBg, borderRadius: "12px", overflow: "hidden", border: `1px solid ${colors.border}` }}>
                  <EventBanner event={event} />

                  <div style={{ padding: "20px" }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: "12px", marginBottom: "12px" }}>
                      <h3 style={{ color: colors.textMain, fontSize: "18px", fontWeight: "800", margin: 0 }}>{event.title}</h3>
                      <span style={{ fontSize: "11px", padding: "4px 10px", borderRadius: "999px", backgroundColor: status.bg, color: status.color, fontWeight: "700", textTransform: "uppercase", flexShrink: 0 }}>
                        {status.label}
                      </span>
                    </div>

                    {event.pending_reason === "edited" && (
                      <p style={{ color: colors.warning, fontSize: "12px", margin: "0 0 12px", fontWeight: "700" }}>Edited event is waiting for admin review.</p>
                    )}

                    {isEditing ? (
                      <div style={{ display: "grid", gap: "12px", marginBottom: "18px" }}>
                        <input value={editForm.title} onChange={e => setEditForm(prev => ({ ...prev, title: e.target.value }))} placeholder="Event title" style={inputStyle} />
                        <textarea value={editForm.description} onChange={e => setEditForm(prev => ({ ...prev, description: e.target.value }))} placeholder="Description" style={{ ...inputStyle, minHeight: "88px", resize: "vertical" }} />
                        <input value={editForm.location} onChange={e => setEditForm(prev => ({ ...prev, location: e.target.value }))} placeholder="Location" style={inputStyle} />
                        <input type="datetime-local" value={editForm.date_time} onChange={e => setEditForm(prev => ({ ...prev, date_time: e.target.value }))} style={inputStyle} />
                        <input type="number" min="1" step="1" value={editForm.capacity} onChange={e => setEditForm(prev => ({ ...prev, capacity: e.target.value }))} placeholder="Capacity" style={inputStyle} />
                        <div style={{ display: "flex", gap: "8px" }}>
                          <button type="button" onClick={() => saveEdit(event)} disabled={savingEdit} style={{ flex: 1, padding: "10px", backgroundColor: colors.accent, color: "#fff", border: "none", borderRadius: "8px", fontSize: "13px", fontWeight: "800", cursor: savingEdit ? "not-allowed" : "pointer" }}>
                            {savingEdit ? "Saving..." : "Save Changes"}
                          </button>
                          <button type="button" onClick={() => setEditingId(null)} style={{ flex: 1, padding: "10px", backgroundColor: "transparent", color: colors.textMuted, border: `1px solid ${colors.border}`, borderRadius: "8px", fontSize: "13px", fontWeight: "700", cursor: "pointer" }}>
                            Cancel Edit
                          </button>
                        </div>
                      </div>
                    ) : (
                      <>
                        <p style={{ color: colors.textMuted, fontSize: "14px", lineHeight: "1.6", margin: "0 0 16px", minHeight: "44px" }}>
                          {event.description || "No description provided."}
                        </p>

                        <div style={{ display: "grid", gap: "8px", marginBottom: "16px" }}>
                          <p style={{ display: "flex", alignItems: "center", gap: "7px", color: colors.textMuted, fontSize: "13px", margin: 0 }}><CalendarDays size={14} /> {formatDate(event.date_time)}</p>
                          <p style={{ display: "flex", alignItems: "center", gap: "7px", color: colors.textMuted, fontSize: "13px", margin: 0 }}><MapPin size={14} /> {event.location || "No location"}</p>
                        </div>
                      </>
                    )}

                    <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "8px", marginBottom: "18px", borderTop: `1px solid ${colors.border}`, borderBottom: `1px solid ${colors.border}`, padding: "12px 0" }}>
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

                    {!isEditing && (
                      <div style={{ display: "grid", gridTemplateColumns: "repeat(2, minmax(0, 1fr))", gap: "8px" }}>
                        <button type="button" onClick={() => openGuests(event)} style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: "6px", padding: "10px", backgroundColor: "rgba(99,102,241,0.12)", color: "#a5b4fc", border: "1px solid rgba(99,102,241,0.3)", borderRadius: "8px", fontSize: "12px", fontWeight: "700", cursor: "pointer" }}>
                          <Users size={14} /> Guest List
                        </button>
                        <button type="button" onClick={() => startEdit(event)} disabled={event.status === "cancelled"} style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: "6px", padding: "10px", backgroundColor: "transparent", color: colors.textMain, border: `1px solid ${colors.border}`, borderRadius: "8px", fontSize: "12px", fontWeight: "700", cursor: event.status === "cancelled" ? "not-allowed" : "pointer", opacity: event.status === "cancelled" ? 0.6 : 1 }}>
                          <Edit3 size={14} /> Edit
                        </button>
                        <button type="button" onClick={() => setArchiveTarget(event)} disabled={event.status === "past" || event.status === "cancelled"} style={{ padding: "10px", backgroundColor: "rgba(245,158,11,0.1)", color: colors.warning, border: "1px solid rgba(245,158,11,0.3)", borderRadius: "8px", fontSize: "12px", fontWeight: "700", cursor: event.status === "past" || event.status === "cancelled" ? "not-allowed" : "pointer", opacity: event.status === "past" || event.status === "cancelled" ? 0.6 : 1 }}>
                          Archive
                        </button>
                        <button type="button" onClick={() => setCancelTarget(event)} disabled={event.status === "cancelled"} style={{ padding: "10px", backgroundColor: "rgba(239,68,68,0.1)", color: colors.error, border: "1px solid rgba(239,68,68,0.3)", borderRadius: "8px", fontSize: "12px", fontWeight: "700", cursor: event.status === "cancelled" ? "not-allowed" : "pointer", opacity: event.status === "cancelled" ? 0.6 : 1 }}>
                          Cancel Event
                        </button>
                      </div>
                    )}
                  </div>
                </article>
              )
            })}
          </div>
        )}
      </div>

      {guestEvent && (
        <div role="dialog" aria-modal="true" onClick={() => setGuestEvent(null)} style={{ position: "fixed", inset: 0, zIndex: 1500, backgroundColor: "rgba(0,0,0,0.72)", display: "flex", alignItems: "center", justifyContent: "center", padding: "20px" }}>
          <div onClick={event => event.stopPropagation()} style={{ width: "100%", maxWidth: "520px", maxHeight: "88vh", overflowY: "auto", backgroundColor: colors.cardBg, border: `1px solid ${colors.border}`, borderRadius: "14px", padding: "22px" }}>
            <h3 style={{ color: colors.textMain, fontSize: "20px", fontWeight: "800", margin: "0 0 6px" }}>{guestEvent.title}</h3>
            <p style={{ color: colors.textMuted, fontSize: "14px", margin: "0 0 18px" }}>Guest list ({guests.length})</p>

            {loadingGuests ? (
              <p style={{ color: colors.textMuted }}>Loading guests...</p>
            ) : guests.length === 0 ? (
              <p style={{ color: colors.textMuted }}>No reservations yet.</p>
            ) : (
              <div style={{ display: "grid", gap: "10px" }}>
                {guests.map(guest => (
                  <div key={guest.id} style={{ display: "flex", justifyContent: "space-between", gap: "12px", padding: "12px", border: `1px solid ${colors.border}`, borderRadius: "10px", backgroundColor: "#0f172a" }}>
                    <div>
                      <p style={{ color: colors.textMain, fontSize: "14px", fontWeight: "700", margin: "0 0 4px" }}>{guest.name}</p>
                      <p style={{ color: colors.textMuted, fontSize: "12px", margin: 0 }}>{guest.email}</p>
                    </div>
                    <p style={{ color: colors.textMuted, fontSize: "12px", margin: 0, whiteSpace: "nowrap" }}>{formatDate(guest.rsvp_date)}</p>
                  </div>
                ))}
              </div>
            )}

            <button type="button" onClick={() => setGuestEvent(null)} style={{ marginTop: "20px", padding: "11px 16px", backgroundColor: "transparent", color: colors.textMuted, border: `1px solid ${colors.border}`, borderRadius: "9px", fontSize: "14px", fontWeight: "700", cursor: "pointer" }}>
              Close
            </button>
          </div>
        </div>
      )}

      <ConfirmModal
        open={Boolean(cancelTarget)}
        title="Cancel event?"
        message={`Are you sure you want to cancel "${cancelTarget?.title}"? Existing reservations will be released.`}
        confirmLabel="Cancel Event"
        tone="warning"
        onCancel={() => setCancelTarget(null)}
        onConfirm={cancelEvent}
      />

      <ConfirmModal
        open={Boolean(archiveTarget)}
        title="Archive event?"
        message={`Are you sure you want to archive "${archiveTarget?.title}"?`}
        confirmLabel="Archive"
        tone="warning"
        onCancel={() => setArchiveTarget(null)}
        onConfirm={archiveEvent}
      />
    </div>
  )
}
