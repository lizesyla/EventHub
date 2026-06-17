import { useState, useEffect } from "react"
import { Link } from "react-router-dom"

const colors = {
  bgDark: "#0f0c1b",
  cardBg: "#1a162e",
  inputBg: "#252142",
  textMain: "#ffffff",
  textMuted: "#b3b0cd",
  accent: "#8b5cf6",
  border: "#2d294e",
  error: "#ef4444",
  green: "#059669",
  orange: "#f59e0b",
}

export default function Organizer() {
  const [events, setEvents] = useState([])
  const [loading, setLoading] = useState(true)
  const [message, setMessage] = useState("")

  const token = localStorage.getItem("token")

  const headers = {
    Authorization: `Bearer ${token}`,
  }

  const fetchEvents = () => {
    setLoading(true)

    fetch("http://localhost:8000/api/events", { headers })
      .then((r) => r.json())
      .then((data) => {
        setEvents(Array.isArray(data) ? data : [])
        setLoading(false)
      })
      .catch(() => {
        setMessage("Failed to load events.")
        setLoading(false)
      })
  }

  useEffect(() => {
    fetchEvents()
  }, [])

  const archiveEvent = async (eventId) => {
    const res = await fetch(`http://localhost:8000/api/events/${eventId}/archive`, {
      method: "PATCH",
      headers,
    })

    if (res.ok) {
      setMessage("Event archived successfully.")
      fetchEvents()
    } else {
      const data = await res.json()
      setMessage(data.detail || "Could not archive event.")
    }
  }

  const cancelEvent = async (eventId) => {
    const confirmCancel = window.confirm(
      "Are you sure you want to cancel this event? RSVPs will be released."
    )

    if (!confirmCancel) return

    const res = await fetch(`http://localhost:8000/api/events/${eventId}/cancel`, {
      method: "PATCH",
      headers,
    })

    if (res.ok) {
      setMessage("Event cancelled successfully and RSVPs were released.")
      fetchEvents()
    } else {
      const data = await res.json()
      setMessage(data.detail || "Could not cancel event.")
    }
  }

  const editEvent = async (event) => {
    const newTitle = window.prompt("New event title:", event.title)

    if (!newTitle) return

    const formData = new FormData()
    formData.append("title", newTitle)

    const res = await fetch(`http://localhost:8000/api/events/${event.id}`, {
      method: "PUT",
      headers,
      body: formData,
    })

    if (res.ok) {
      setMessage("Event updated successfully.")
      fetchEvents()
    } else {
      const data = await res.json()
      setMessage(data.detail || "Could not update event.")
    }
  }

  const getStatusLabel = (status) => {
    if (status === "past") return "Archived"
    if (status === "cancelled") return "Cancelled"
    return "Active"
  }

  const getStatusColor = (status) => {
    if (status === "past") return "#9ca3af"
    if (status === "cancelled") return colors.error
    return "#10b981"
  }

  return (
    <div
      style={{
        backgroundColor: colors.bgDark,
        minHeight: "100vh",
        padding: "40px 20px",
        fontFamily: "'Inter', sans-serif",
      }}
    >
      <div style={{ maxWidth: "1100px", margin: "0 auto" }}>
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            marginBottom: "32px",
          }}
        >
          <div>
            <h2
              style={{
                fontSize: "32px",
                fontWeight: "700",
                color: colors.textMain,
                margin: 0,
              }}
            >
              Organizer Dashboard
            </h2>
            <p style={{ color: colors.textMuted, fontSize: "15px", marginTop: "8px" }}>
              Manage your events and see who has signed up
            </p>
          </div>

          <Link
            to="/create-event"
            style={{
              padding: "12px 24px",
              backgroundColor: colors.accent,
              color: "#fff",
              borderRadius: "8px",
              textDecoration: "none",
              fontSize: "14px",
              fontWeight: "600",
            }}
          >
            + Create Event
          </Link>
        </div>

        {message && (
          <div
            style={{
              marginBottom: "20px",
              padding: "14px",
              borderRadius: "8px",
              backgroundColor: colors.inputBg,
              color: colors.textMain,
              border: `1px solid ${colors.border}`,
            }}
          >
            {message}
          </div>
        )}

        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(3, 1fr)",
            gap: "16px",
            marginBottom: "32px",
          }}
        >
          {[
            { label: "Total Events", value: events.length, icon: "📅" },
            {
              label: "Active Events",
              value: events.filter((e) => e.status === "upcoming").length,
              icon: "✅",
            },
            {
              label: "Archived/Cancelled",
              value: events.filter((e) => e.status === "past" || e.status === "cancelled")
                .length,
              icon: "📦",
            },
          ].map((stat, i) => (
            <div
              key={i}
              style={{
                backgroundColor: colors.cardBg,
                padding: "24px",
                borderRadius: "12px",
                border: `1px solid ${colors.border}`,
                textAlign: "center",
              }}
            >
              <p style={{ fontSize: "32px", margin: "0 0 8px" }}>{stat.icon}</p>
              <p
                style={{
                  fontSize: "28px",
                  fontWeight: "700",
                  color: colors.textMain,
                  margin: "0 0 4px",
                }}
              >
                {stat.value}
              </p>
              <p style={{ fontSize: "13px", color: colors.textMuted, margin: 0 }}>
                {stat.label}
              </p>
            </div>
          ))}
        </div>

        <h3
          style={{
            color: colors.textMain,
            fontSize: "20px",
            fontWeight: "700",
            marginBottom: "20px",
          }}
        >
          My Events
        </h3>

        {loading ? (
          <p style={{ color: colors.textMuted }}>Loading events...</p>
        ) : events.length === 0 ? (
          <div
            style={{
              textAlign: "center",
              padding: "60px",
              backgroundColor: colors.cardBg,
              borderRadius: "16px",
              border: `1px solid ${colors.border}`,
            }}
          >
            <p style={{ fontSize: "40px", marginBottom: "12px" }}>📅</p>
            <p style={{ color: colors.textMuted, fontSize: "16px", marginBottom: "20px" }}>
              You haven't created any events yet.
            </p>
            <Link
              to="/create-event"
              style={{
                padding: "12px 24px",
                backgroundColor: colors.accent,
                color: "#fff",
                borderRadius: "8px",
                textDecoration: "none",
                fontSize: "14px",
                fontWeight: "600",
              }}
            >
              Create your first event
            </Link>
          </div>
        ) : (
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fill, minmax(320px, 1fr))",
              gap: "20px",
            }}
          >
            {events.map((event) => (
              <div
                key={event.id}
                style={{
                  backgroundColor: colors.cardBg,
                  borderRadius: "12px",
                  overflow: "hidden",
                  border: `1px solid ${colors.border}`,
                }}
              >
                {event.banner_url ? (
                  <img
                    src={event.banner_url}
                    alt="Banner"
                    style={{ width: "100%", height: "160px", objectFit: "cover" }}
                  />
                ) : (
                  <div
                    style={{
                      width: "100%",
                      height: "160px",
                      backgroundColor: colors.inputBg,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      fontSize: "40px",
                    }}
                  >
                    📅
                  </div>
                )}

                <div style={{ padding: "20px" }}>
                  <div
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "flex-start",
                      marginBottom: "8px",
                    }}
                  >
                    <h3
                      style={{
                        color: colors.textMain,
                        fontSize: "16px",
                        fontWeight: "700",
                        margin: 0,
                      }}
                    >
                      {event.title}
                    </h3>

                    <span
                      style={{
                        fontSize: "11px",
                        padding: "3px 8px",
                        borderRadius: "12px",
                        backgroundColor: "#ffffff14",
                        color: getStatusColor(event.status),
                        fontWeight: "600",
                      }}
                    >
                      {getStatusLabel(event.status)}
                    </span>
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
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}