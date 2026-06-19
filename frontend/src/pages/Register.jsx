import { useState } from "react"
import { useNavigate, Link } from "react-router-dom"

const colors = {
  bgDark: '#0f172a', cardBg: '#1e293b', inputBg: '#0f172a',
  textMain: '#ffffff', textMuted: '#94a3b8', accent: '#6366f1',
  border: '#334155', error: '#ef4444', green: '#10b981'
}

const inputStyle = {
  width: '100%', padding: '12px 14px', borderRadius: '10px',
  border: `1px solid ${colors.border}`, backgroundColor: colors.inputBg,
  color: colors.textMain, fontSize: '14px', marginTop: '6px', boxSizing: 'border-box',
  outline: 'none'
}

export default function Register() {
  const [name, setName] = useState("")
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [role, setRole] = useState("attendee")
  const [error, setError] = useState("")
  const [pending, setPending] = useState(false)
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
      if (role === "organizer") {
        setPending(true)
      } else {
        navigate("/login")
      }
    } else {
      setError(data.detail || "Registration failed")
    }
  }

  const roles = [
    { value: "attendee", label: "👤 Attendee", desc: "Browse and sign up for events." },
    { value: "organizer", label: "🎯 Organizer", desc: "Create and manage events. Requires admin approval." },
  ]

  if (pending) {
    return (
      <div style={{ backgroundColor: colors.bgDark, minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px' }}>
        <div style={{ backgroundColor: colors.cardBg, padding: '48px 36px', borderRadius: '20px', border: `1px solid ${colors.border}`, width: '100%', maxWidth: '440px', textAlign: 'center' }}>
          <div style={{ fontSize: '56px', marginBottom: '20px' }}>⏳</div>
          <h2 style={{ color: colors.textMain, fontSize: '24px', fontWeight: '700', margin: '0 0 12px' }}>Pending Approval</h2>
          <p style={{ color: colors.textMuted, fontSize: '15px', lineHeight: '1.6', margin: '0 0 28px' }}>
            Your organizer account has been created. An admin needs to approve it before you can log in.
          </p>
          <div style={{ padding: '16px', backgroundColor: 'rgba(99,102,241,0.1)', border: '1px solid rgba(99,102,241,0.2)', borderRadius: '12px', marginBottom: '28px' }}>
            <p style={{ color: '#a5b4fc', fontSize: '14px', margin: 0 }}>
              📧 You will be notified once your account is approved.
            </p>
          </div>
          <Link to="/login" style={{ display: 'block', padding: '13px', backgroundColor: colors.accent, color: '#fff', borderRadius: '10px', textDecoration: 'none', fontSize: '15px', fontWeight: '600' }}>
            Back to Sign In
          </Link>
        </div>
      </div>
    )
  }

  return (
    
    <div style={{ backgroundColor: colors.bgDark, minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px' }}>
      <div style={{ backgroundColor: colors.cardBg, padding: '40px 36px', borderRadius: '20px', border: `1px solid ${colors.border}`, width: '100%', maxWidth: '440px' }}>

      <Link to="/login" style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', color: colors.textMuted, textDecoration: 'none', fontSize: '14px', marginBottom: '24px' }}
  onMouseEnter={e => e.currentTarget.style.color = colors.accent}
  onMouseLeave={e => e.currentTarget.style.color = colors.textMuted}
>
  ← Back to Sign In
</Link>
        <div style={{ marginBottom: '32px' }}>
          <p style={{ color: colors.accent, fontSize: '12px', fontWeight: '700', letterSpacing: '3px', textTransform: 'uppercase', margin: '0 0 12px' }}>EVENTHUB</p>
          <h2 style={{ color: colors.textMain, fontSize: '26px', fontWeight: '800', margin: '0 0 8px', letterSpacing: '-0.5px' }}>Create an account</h2>
          <p style={{ color: colors.textMuted, fontSize: '14px', margin: 0 }}>Internal Events Platform · Genpact</p>
        </div>

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

        {/* Role Selection */}
        <div style={{ marginBottom: '28px' }}>
          <label style={{ fontSize: '13px', fontWeight: '600', color: colors.textMuted, display: 'block', marginBottom: '10px' }}>Select Your Role</label>
          <div style={{ display: 'flex', gap: '10px' }}>
            {roles.map(r => (
              <button key={r.value} onClick={() => setRole(r.value)} style={{
                flex: 1, padding: '12px 8px', borderRadius: '10px', cursor: 'pointer',
                fontSize: '13px', fontWeight: '600',
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
          {role === 'organizer' && (
            <div style={{ marginTop: '10px', padding: '10px 14px', backgroundColor: 'rgba(245,158,11,0.1)', border: '1px solid rgba(245,158,11,0.3)', borderRadius: '8px' }}>
              <p style={{ color: '#f59e0b', fontSize: '12px', margin: 0 }}>
                ⚠️ Organizer accounts require admin approval before you can log in.
              </p>
            </div>
          )}
        </div>

        {error && (
          <div style={{ padding: '12px 14px', backgroundColor: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.3)', borderRadius: '8px', marginBottom: '16px' }}>
            <p style={{ color: colors.error, fontSize: '14px', margin: 0 }}>❌ {error}</p>
          </div>
        )}

        <button
          onClick={handleRegister}
          style={{ width: '100%', padding: '14px', backgroundColor: colors.accent, color: '#fff', border: 'none', borderRadius: '10px', fontSize: '15px', fontWeight: '700', cursor: 'pointer', boxShadow: '0 4px 20px rgba(99,102,241,0.4)' }}>
          Create Account →
        </button>

        <p style={{ textAlign: 'center', marginTop: '20px', color: colors.textMuted, fontSize: '14px' }}>
          Already have an account?{' '}
          <Link to="/login" style={{ color: colors.accent, fontWeight: '600', textDecoration: 'none' }}>Sign in</Link>
        </p>
      </div>
    </div>
  )
}