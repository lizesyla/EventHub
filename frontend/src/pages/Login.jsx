import { useState } from "react"
import { Link } from "react-router-dom"

const colors = {
  bgDark: "#0f172a",
  cardBg: "#1e293b",
  inputBg: "#0f172a",
  textMain: "#ffffff",
  textMuted: "#94a3b8",
  accent: "#6366f1",
  border: "#334155",
  error: "#ef4444",
  warning: "#f59e0b",
}

const inputStyle = {
  width: "100%",
  padding: "12px 14px",
  borderRadius: "10px",
  border: `1px solid ${colors.border}`,
  backgroundColor: colors.inputBg,
  color: colors.textMain,
  fontSize: "14px",
  marginTop: "6px",
  boxSizing: "border-box",
  outline: "none",
}

function getErrorMessage(detail) {
  if (typeof detail === "string") return detail
  if (Array.isArray(detail)) {
    return detail
      .map(item => item.msg || item.message || "Invalid login request.")
      .join(" ")
  }
  return "The email or password you entered is incorrect."
}

export default function Login({ onLogin }) {
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [error, setError] = useState("")
  const [isPending, setIsPending] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)

  async function handleLogin(event) {
    event?.preventDefault()
    if (isSubmitting) return

    setError("")
    setIsPending(false)

    const cleanEmail = email.trim()
    if (!cleanEmail || !password) {
      setError("Please fill in all fields.")
      return
    }

    setIsSubmitting(true)

    try {
      const res = await fetch("http://localhost:8000/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: cleanEmail, password }),
      })

      const contentType = res.headers.get("content-type") || ""
      const data = contentType.includes("application/json") ? await res.json() : {}

      if (!res.ok) {
        const message = getErrorMessage(data.detail)
        if (message.includes("pending admin approval")) {
          setIsPending(true)
        } else {
          setError(message || `Login failed with status ${res.status}.`)
        }
        return
      }

      if (!data.access_token || !data.user?.role) {
        setError("Login succeeded, but the server response was incomplete.")
        return
      }

      localStorage.setItem("token", data.access_token)
      localStorage.setItem("refresh_token", data.refresh_token)
      localStorage.setItem("user", JSON.stringify(data.user))

      if (onLogin) onLogin(data.access_token)

      const role = data.user.role
      if (role === "admin") window.location.href = "/admin"
      else if (role === "organizer") window.location.href = "/organizer"
      else window.location.href = "/"
    } else {
      // Shfaq mesazhin e saktë nga backend
      if (data.detail && data.detail.includes("pending admin approval")) {
        setIsPending(true)
      } else {
        setError(data.detail || "The email or password you entered is incorrect.")
      }
    }
  }

  return (
    <div style={{ backgroundColor: colors.bgDark, minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", padding: "20px" }}>
      <div style={{ backgroundColor: colors.cardBg, padding: "36px", borderRadius: "16px", border: `1px solid ${colors.border}`, width: "100%", maxWidth: "400px" }}>
        <h2 style={{ color: colors.textMain, fontSize: "24px", fontWeight: "700", margin: "0 0 8px 0" }}>Welcome back</h2>
        <p style={{ color: colors.textMuted, fontSize: "14px", marginBottom: "28px" }}>EventHub · Internal Platform</p>

        <div style={{ marginBottom: "16px" }}>
          <label style={{ fontSize: "13px", fontWeight: "600", color: colors.textMuted }}>Email</label>
          <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="john@company.com" style={inputStyle} />
        </div>
        

        <div style={{ marginBottom: "32px" }}>
          <p style={{ color: colors.accent, fontSize: "12px", fontWeight: "700", letterSpacing: "3px", textTransform: "uppercase", margin: "0 0 12px" }}>EVENTHUB</p>
          <h2 style={{ color: colors.textMain, fontSize: "26px", fontWeight: "800", margin: "0 0 8px", letterSpacing: "-0.5px" }}>Welcome back</h2>
          <p style={{ color: colors.textMuted, fontSize: "14px", margin: 0 }}>Internal Events Platform - Genpact</p>
        </div>

        <form onSubmit={handleLogin}>
          <div style={{ marginBottom: "16px" }}>
            <label style={{ fontSize: "13px", fontWeight: "600", color: colors.textMuted }}>Email</label>
            <input
              type="email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              placeholder="john@company.com"
              style={inputStyle}
              autoComplete="email"
            />
          </div>

          <div style={{ marginBottom: "28px" }}>
            <label style={{ fontSize: "13px", fontWeight: "600", color: colors.textMuted }}>Password</label>
            <input
              type="password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              placeholder="Password"
              style={inputStyle}
              autoComplete="current-password"
            />
          </div>

          {error && (
            <div style={{ padding: "12px 14px", backgroundColor: "rgba(239,68,68,0.1)", border: "1px solid rgba(239,68,68,0.3)", borderRadius: "8px", marginBottom: "16px" }}>
              <p style={{ color: colors.error, fontSize: "14px", margin: 0 }}>{error}</p>
            </div>
          )}

          {isPending && (
            <div style={{ padding: "16px", backgroundColor: "rgba(245,158,11,0.1)", border: "1px solid rgba(245,158,11,0.3)", borderRadius: "10px", marginBottom: "16px" }}>
              <p style={{ color: colors.warning, fontSize: "14px", fontWeight: "700", margin: "0 0 6px" }}>Account Pending Approval</p>
              <p style={{ color: colors.textMuted, fontSize: "13px", margin: 0 }}>
                Your organizer account is awaiting admin approval. You will be able to sign in once approved.
              </p>
            </div>
          )}

          <button
            type="submit"
            disabled={isSubmitting}
            style={{ width: "100%", padding: "14px", backgroundColor: colors.accent, color: "#fff", border: "none", borderRadius: "10px", fontSize: "15px", fontWeight: "700", cursor: isSubmitting ? "not-allowed" : "pointer", opacity: isSubmitting ? 0.75 : 1, boxShadow: "0 4px 20px rgba(99,102,241,0.4)", transition: "all 0.2s" }}
          >
            {isSubmitting ? "Signing in..." : "Sign In ->"}
          </button>
        </form>

        <p style={{ textAlign: "center", marginTop: "20px", color: colors.textMuted, fontSize: "14px" }}>
          Don't have an account?{" "}
          <Link to="/register" style={{ color: colors.accent, fontWeight: "600", textDecoration: "none" }}>Register</Link>
        </p>
      </div>
    </div>
  )
}
