import { useState } from "react"
import { useNavigate, Link } from "react-router-dom"

const colors = {
  bgDark: '#0f0c1b', cardBg: '#1a162e', inputBg: '#252142',
  textMain: '#ffffff', textMuted: '#b3b0cd', accent: '#8b5cf6',
  border: '#2d294e', error: '#ef4444'
}

const inputStyle = {
  width: '100%', padding: '12px', borderRadius: '8px',
  border: `1px solid ${colors.border}`, backgroundColor: colors.inputBg,
  color: colors.textMain, fontSize: '14px', marginTop: '6px', boxSizing: 'border-box',
}

export default function Login({ onLogin }) {
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [error, setError] = useState("")
  const navigate = useNavigate()

  async function handleLogin() {
    setError("")
    if (!email || !password) {
      setError("Please fill in all fields"); return
    }

    const res = await fetch("http://localhost:8000/api/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password })
    })
    const data = await res.json()
    if (res.ok) {
      onLogin(data.access_token)
      const role = data.user.role
      if (role === "admin") window.location.href = "/admin"
else if (role === "organizer") window.location.href = "/organizer"
else window.location.href = "/"
    } else {
      setError(data.detail || "Invalid credentials")
    }
  }

  return (
    <div style={{ backgroundColor: colors.bgDark, minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px' }}>
      <div style={{ backgroundColor: colors.cardBg, padding: '36px', borderRadius: '16px', border: `1px solid ${colors.border}`, width: '100%', maxWidth: '400px' }}>

        <h2 style={{ color: colors.textMain, fontSize: '24px', fontWeight: '700', margin: '0 0 8px 0' }}>Welcome back</h2>
        <p style={{ color: colors.textMuted, fontSize: '14px', marginBottom: '28px' }}>EventHub · Internal Platform</p>

        <div style={{ marginBottom: '16px' }}>
          <label style={{ fontSize: '13px', fontWeight: '600', color: colors.textMuted }}>Email</label>
          <input
            type="email"
            value={email}
            onChange={e => setEmail(e.target.value)}
            placeholder="john@company.com"
            style={inputStyle}
          />
        </div>

        <div style={{ marginBottom: '24px' }}>
          <label style={{ fontSize: '13px', fontWeight: '600', color: colors.textMuted }}>Password</label>
          <input
            type="password"
            value={password}
            onChange={e => setPassword(e.target.value)}
            placeholder="••••••••"
            style={inputStyle}
          />
        </div>

        {error && <p style={{ color: colors.error, fontSize: '14px', marginBottom: '16px' }}>{error}</p>}

        <button onClick={handleLogin} style={{ width: '100%', padding: '13px', backgroundColor: colors.accent, color: '#fff', border: 'none', borderRadius: '8px', fontSize: '15px', fontWeight: '600', cursor: 'pointer' }}>
          Sign In
        </button>

        <p style={{ textAlign: 'center', marginTop: '20px', color: colors.textMuted, fontSize: '14px' }}>
          Don't have an account?{' '}
          <Link to="/register" style={{ color: colors.accent, fontWeight: '600', textDecoration: 'none' }}>Register</Link>
        </p>

      </div>
    </div>
  )
}