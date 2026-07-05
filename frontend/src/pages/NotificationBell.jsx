import { useState, useEffect, useRef } from "react"
import { Bell, X, Check } from "lucide-react"
import { API_BASE_URL } from "../config/api"

export default function NotificationBell({ iconColor = "#ffffff" }) {
  const [notifications, setNotifications] = useState([])
  const [unreadCount, setUnreadCount] = useState(0)
  const [isOpen, setIsOpen] = useState(false)
  const [isMobile, setIsMobile] = useState(false)
  const dropdownRef = useRef(null)
  const token = localStorage.getItem("token")

  useEffect(() => {
    const checkSize = () => setIsMobile(window.innerWidth <= 640)
    checkSize()
    window.addEventListener("resize", checkSize)
    return () => window.removeEventListener("resize", checkSize)
  }, [])

  useEffect(() => {
    if (!token) return
    fetchNotifications()
    fetchUnreadCount()

    const interval = setInterval(fetchUnreadCount, 15000)
    return () => clearInterval(interval)
  }, [token])

  useEffect(() => {
    function handleClickOutside(e) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setIsOpen(false)
      }
    }

    document.addEventListener("mousedown", handleClickOutside)
    return () => document.removeEventListener("mousedown", handleClickOutside)
  }, [])

  function fetchNotifications() {
    fetch(`${API_BASE_URL}/api/notifications`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then(r => r.json())
      .then(data => setNotifications(Array.isArray(data) ? data : []))
      .catch(() => {})
  }

  function fetchUnreadCount() {
    fetch(`${API_BASE_URL}/api/notifications/unread-count`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then(r => r.json())
      .then(data => setUnreadCount(data.unread_count || 0))
      .catch(() => {})
  }

  function toggleOpen() {
    setIsOpen(prev => {
      const next = !prev
      if (next) fetchNotifications()
      return next
    })
  }

  async function markAsRead(id) {
    await fetch(`${API_BASE_URL}/api/notifications/${id}/read`, {
      method: "PATCH",
      headers: { Authorization: `Bearer ${token}` },
    })
    setNotifications(prev => prev.map(n => (n.id === id ? { ...n, is_read: true } : n)))
    fetchUnreadCount()
  }

  async function markAllAsRead() {
    await fetch(`${API_BASE_URL}/api/notifications/mark-all-read`, {
      method: "PATCH",
      headers: { Authorization: `Bearer ${token}` },
    })
    setNotifications(prev => prev.map(n => ({ ...n, is_read: true })))
    setUnreadCount(0)
  }

  async function deleteNotification(id) {
    await fetch(`${API_BASE_URL}/api/notifications/${id}`, {
      method: "DELETE",
      headers: { Authorization: `Bearer ${token}` },
    })
    setNotifications(prev => prev.filter(n => n.id !== id))
    fetchUnreadCount()
  }

  if (!token) return null

  const dropdownStyle = isMobile
    ? {
        position: "fixed",
        top: "72px",
        left: "12px",
        right: "12px",
        width: "auto",
        maxHeight: "70vh",
        overflowY: "auto",
        backgroundColor: "#1a162e",
        border: "1px solid #2d294e",
        borderRadius: "14px",
        boxShadow: "0 10px 40px rgba(0,0,0,0.45)",
        zIndex: 9999,
      }
    : {
        position: "absolute",
        top: "calc(100% + 10px)",
        right: 0,
        width: "360px",
        maxWidth: "calc(100vw - 24px)",
        maxHeight: "440px",
        overflowY: "auto",
        backgroundColor: "#1a162e",
        border: "1px solid #2d294e",
        borderRadius: "12px",
        boxShadow: "0 10px 40px rgba(0,0,0,0.4)",
        zIndex: 1000,
      }

  return (
    <div ref={dropdownRef} style={{ position: "relative" }}>
      <button
        onClick={toggleOpen}
        aria-label="Open notifications"
        style={{
          position: "relative",
          background: "transparent",
          border: "none",
          cursor: "pointer",
          padding: "8px",
          display: "flex",
          alignItems: "center",
        }}
      >
        <Bell size={20} color={iconColor} />

        {unreadCount > 0 && (
          <>
            <span
              style={{
                position: "absolute",
                top: "2px",
                right: "2px",
                width: "16px",
                height: "16px",
                borderRadius: "50%",
                backgroundColor: "#ef4444",
                opacity: 0.6,
                animation: "notif-pulse 1.8s ease-out infinite",
              }}
            />
            <span
              style={{
                position: "absolute",
                top: "2px",
                right: "2px",
                backgroundColor: "#ef4444",
                color: "#fff",
                borderRadius: "50%",
                minWidth: "16px",
                height: "16px",
                fontSize: "10px",
                fontWeight: "700",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                padding: "0 3px",
              }}
            >
              {unreadCount > 9 ? "9+" : unreadCount}
            </span>
            <style>{`
              @keyframes notif-pulse {
                0% { transform: scale(1); opacity: 0.6; }
                100% { transform: scale(2.2); opacity: 0; }
              }
            `}</style>
          </>
        )}
      </button>

      {isOpen && (
        <div style={dropdownStyle}>
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              gap: "12px",
              padding: isMobile ? "14px" : "14px 16px",
              borderBottom: "1px solid #2d294e",
            }}
          >
            <span style={{ color: "#fff", fontWeight: "700", fontSize: "14px" }}>Notifications</span>
            <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
              {unreadCount > 0 && (
                <button
                  onClick={markAllAsRead}
                  style={{
                    background: "none",
                    border: "none",
                    color: "#8b5cf6",
                    fontSize: "12px",
                    fontWeight: "600",
                    cursor: "pointer",
                    whiteSpace: "nowrap",
                  }}
                >
                  Mark all read
                </button>
              )}

              {isMobile && (
                <button
                  onClick={() => setIsOpen(false)}
                  aria-label="Close notifications"
                  style={{ background: "none", border: "none", cursor: "pointer", padding: "4px" }}
                >
                  <X size={18} color="#fff" />
                </button>
              )}
            </div>
          </div>

          {notifications.length === 0 ? (
            <div style={{ padding: "32px 16px", textAlign: "center" }}>
              <Bell size={28} color="#6b6478" style={{ marginBottom: "8px" }} />
              <p style={{ color: "#9d94ad", fontSize: "13px", margin: 0 }}>No notifications yet.</p>
            </div>
          ) : (
            notifications.map(n => (
              <div
                key={n.id}
                style={{
                  display: "flex",
                  alignItems: "flex-start",
                  gap: "10px",
                  padding: isMobile ? "12px" : "12px 16px",
                  borderBottom: "1px solid #2d294e",
                  backgroundColor: n.is_read ? "transparent" : "rgba(139,92,246,0.08)",
                }}
              >
                <div style={{ flex: 1, minWidth: 0 }}>
                  <p
                    style={{
                      color: "#fff",
                      fontSize: isMobile ? "12px" : "13px",
                      margin: "0 0 4px",
                      lineHeight: "1.45",
                      overflowWrap: "anywhere",
                      wordBreak: "break-word",
                    }}
                  >
                    {n.message}
                  </p>
                  <p style={{ color: "#6b6478", fontSize: "11px", margin: 0 }}>
                    {new Date(n.created_at).toLocaleString("en-US", { dateStyle: "medium", timeStyle: "short" })}
                  </p>
                </div>

                <div style={{ display: "flex", gap: "4px", flexShrink: 0 }}>
                  {!n.is_read && (
                    <button
                      onClick={() => markAsRead(n.id)}
                      title="Mark as read"
                      style={{ background: "none", border: "none", cursor: "pointer", padding: "4px" }}
                    >
                      <Check size={14} color="#10b981" />
                    </button>
                  )}
                  <button
                    onClick={() => deleteNotification(n.id)}
                    title="Delete"
                    style={{ background: "none", border: "none", cursor: "pointer", padding: "4px" }}
                  >
                    <X size={14} color="#ef4444" />
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      )}
    </div>
  )
}
