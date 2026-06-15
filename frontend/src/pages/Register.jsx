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

export default function Register() {
  const [name, setName] = useState("")
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [role, setRole] = useState("attendee")
  const [error, setError] = useState("")
  const navigate = useNavigate()

  async function handleRegister() {
    setError("")
    if (!name || !email || !password || !confirmPassword) {
      setError("Please fill in all fields"); return
    }
    if (password !== confirmPassword) {
      setError("Passwords do not match"); return
    }
    if (password.length < 8) {
      setError("Password must be at least 8 characters"); return
    }

    const res = await fetch("http://localhost:8000/api/auth/register", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, email, password, role })
    })
    const data = await res.json()
    if (res.ok) {
      navigate("/login")
    } else {
      setError(data.detail || "Registration failed")
    }
  }

  const roles = [
    { value: "attendee", label: "👤 Attendee", desc: "Browse and sign up for events." },
    { value: "organizer", label: "🎯 Organizer", desc: "Create and manage events." },
    { value: "admin", label: "🛡️ Admin", desc: "Moderate all events and accounts." },
  ]

  return (
    <div style={{ backgroundColor: colors.bgDark, minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px' }}>
      <div style={{ backgroundColor: colors.cardBg, padding: '36px', borderRadius: '16px', border: `1px solid ${colors.border}`, width: '100%', maxWidth: '440px' }}>

        <h2 style={{ color: colors.textMain, fontSize: '24px', fontWeight: '700', margin: '0 0 8px 0' }}>Create an account</h2>
        <p style={{ color: colors.textMuted, fontSize: '14px', marginBottom: '28px' }}>EventHub · Internal Platform</p>

        <div style={{ marginBottom: '16px' }}>
          <label style={{ fontSize: '13px', fontWeight: '600', color: colors.textMuted }}>Full Name</label>
          <input value={name} onChange={e => setName(e.target.value)} placeholder="John Doe" style={inputStyle} />
        </div>

        <div style={{ marginBottom: '16px' }}>
          <label style={{ fontSize: '13px', fontWeight: '600', color: colors.textMuted }}>Email</label>
          <input type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="john@company.com" style={inputStyle} />
        </div>

        <div style={{ marginBottom: '16px' }}>
          <label style={{ fontSize: '13px', fontWeight: '600', color: colors.textMuted }}>Password</label>
          <input type="password" value={password} onChange={e => setPassword(e.target.value)} placeholder="Minimum 8 characters" style={inputStyle} />
        </div>

        <div style={{ marginBottom: '24px' }}>
          <label style={{ fontSize: '13px', fontWeight: '600', color: colors.textMuted }}>Confirm Password</label>
          <input type="password" value={confirmPassword} onChange={e => setConfirmPassword(e.target.value)} placeholder="••••••••" style={inputStyle} />
        </div>

        <div style={{ marginBottom: '24px' }}>
          <label style={{ fontSize: '13px', fontWeight: '600', color: colors.textMuted, display: 'block', marginBottom: '10px' }}>Select Your Role</label>
          <div style={{ display: 'flex', gap: '10px' }}>
            {roles.map(r => (
              <button key={r.value} onClick={() => setRole(r.value)} style={{
                flex: 1, padding: '10px 6px', borderRadius: '8px', cursor: 'pointer', fontSize: '13px', fontWeight: '600',
                border: `2px solid ${role === r.value ? colors.accent : colors.border}`,
                backgroundColor: role === r.value ? colors.accent + '22' : 'transparent',
                color: role === r.value ? colors.accent : colors.textMuted,
                transition: 'all 0.2s'
              }}>
                {r.label}
              </button>
            ))}
          </div>
          <p style={{ color: colors.textMuted, fontSize: '12px', marginTop: '8px' }}>
            {roles.find(r => r.value === role)?.desc}
          </p>
        </div>

        {error && <p style={{ color: colors.error, fontSize: '14px', marginBottom: '16px' }}>{error}</p>}

        <button onClick={handleRegister} style={{ width: '100%', padding: '13px', backgroundColor: colors.accent, color: '#fff', border: 'none', borderRadius: '8px', fontSize: '15px', fontWeight: '600', cursor: 'pointer' }}>
          Register
        </button>

        <p style={{ textAlign: 'center', marginTop: '20px', color: colors.textMuted, fontSize: '14px' }}>
          Already have an account?{' '}
          <Link to="/login" style={{ color: colors.accent, fontWeight: '600', textDecoration: 'none' }}>Sign in</Link>
        </p>

      </div>
    </div>
  )
}