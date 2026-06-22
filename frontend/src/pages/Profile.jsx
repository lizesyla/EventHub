import { useState, useEffect } from "react"
import { apiUrl } from '../config/api';

const colors = {
  bgDark: '#0f0c1b',
  cardBg: '#1a162e',
  inputBg: '#252142',
  textMain: '#ffffff',
  textMuted: '#b3b0cd',
  accent: '#8b5cf6',
  accentGreen: '#059669',
  border: '#2d294e',
  error: '#ef4444'
}

const inputStyle = {
  width: '100%',
  padding: '12px',
  borderRadius: '8px',
  border: `1px solid ${colors.border}`,
  backgroundColor: colors.inputBg,
  color: colors.textMain,
  fontSize: '14px',
  marginTop: '6px',
  boxSizing: 'border-box',
}

function getStrength(password) {
  if (!password) return { label: '', color: '', width: '0%' }
  let score = 0
  if (password.length >= 8) score++
  if (password.length >= 12) score++
  if (/[A-Z]/.test(password)) score++
  if (/[0-9]/.test(password)) score++
  if (/[^A-Za-z0-9]/.test(password)) score++
  if (score <= 1) return { label: 'Weak', color: '#ef4444', width: '25%' }
  if (score <= 2) return { label: 'Fair', color: '#f97316', width: '50%' }
  if (score <= 3) return { label: 'Good', color: '#eab308', width: '75%' }
  return { label: 'Strong', color: '#10b981', width: '100%' }
}

function PasswordInput({ value, onChange, placeholder }) {
  const [show, setShow] = useState(false)
  return (
    <div style={{ position: 'relative', marginTop: '6px' }}>
      <input
        type={show ? 'text' : 'password'}
        value={value}
        onChange={onChange}
        placeholder={placeholder || '••••••••'}
        style={{ ...inputStyle, marginTop: 0, paddingRight: '44px' }}
      />
      <button
        onClick={() => setShow(!show)}
        style={{ position: 'absolute', right: '12px', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: colors.textMuted, fontSize: '16px', padding: 0 }}
      >
        {show ? '🙈' : '👁️'}
      </button>
    </div>
  )
}

export default function Profile() {
  const [activeTab, setActiveTab] = useState('profile')
  const [profile, setProfile] = useState(null)
  const [name, setName] = useState("")
  const [saveMsg, setSaveMsg] = useState("")
  const [currentPassword, setCurrentPassword] = useState("")
  const [newPassword, setNewPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [passwordMsg, setPasswordMsg] = useState("")
  const [loading, setLoading] = useState(true)

  const token = localStorage.getItem("token")
  const headers = {
    "Content-Type": "application/json",
    "Authorization": `Bearer ${token}`,
  }
  const strength = getStrength(newPassword)

  useEffect(() => {
    fetch(apiUrl("/api/profile/me"), { headers })
      .then(r => r.json())
      .then(data => {
        setProfile(data)
        setName(data.name)
        setLoading(false)
      })
      .catch(() => setLoading(false))
    // headers is derived from token which is stable for the session
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  async function handleSave() {
    setSaveMsg("")
    const res = await fetch(apiUrl("/api/profile/me"), {
      method: "PUT",
      headers,
      body: JSON.stringify({ name })
    })
    if (res.ok) {
      setProfile(prev => ({ ...prev, name }))
      setSaveMsg("✅ Changes saved successfully!")
      setTimeout(() => setSaveMsg(""), 2000)
    } else {
      setSaveMsg("❌ Failed to save changes")
      setTimeout(() => setSaveMsg(""), 2000)
    }
  }

  async function handleChangePassword() {
    setPasswordMsg("")
    if (!currentPassword || !newPassword || !confirmPassword) {
      setPasswordMsg("❌ Please fill in all fields"); return
    }
    if (newPassword === currentPassword) {
      setPasswordMsg("❌ New password must be different from current password"); return
    }
    if (newPassword.length < 8) {
      setPasswordMsg("❌ New password must be at least 8 characters"); return
    }
    if (newPassword !== confirmPassword) {
      setPasswordMsg("❌ Passwords do not match"); return
    }
    const res = await fetch(apiUrl("/api/profile/me/password"), {
      method: "PUT",
      headers,
      body: JSON.stringify({ current_password: currentPassword, new_password: newPassword })
    })
    const data = await res.json()
    if (res.ok) {
      setPasswordMsg("✅ Password changed successfully!")
      setCurrentPassword(""); setNewPassword(""); setConfirmPassword("")
    } else {
      setPasswordMsg(`❌ ${data.detail}`)
    }
    setTimeout(() => setPasswordMsg(""), 3000)
  }

  if (loading) return (
    <div style={{ backgroundColor: colors.bgDark, minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', color: colors.textMain }}>
      Loading...
    </div>
  )

  if (!profile) return (
    <div style={{ backgroundColor: colors.bgDark, minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', color: colors.error }}>
      Profile not found. Please log in first.
    </div>
  )

  return (
    <div style={{ backgroundColor: colors.bgDark, minHeight: '100vh', padding: '40px 20px', fontFamily: "'Inter', system-ui, sans-serif" }}>
      <div style={{ maxWidth: '700px', margin: '0 auto' }}>

        {/* HEADER me Avatar */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '20px', marginBottom: '32px' }}>
          <div style={{ width: '72px', height: '72px', borderRadius: '50%', backgroundColor: colors.accent + '33', border: `2px solid ${colors.accent}`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '28px', fontWeight: '700', color: colors.accent, flexShrink: 0 }}>
            {profile.name?.charAt(0).toUpperCase()}
          </div>
          <div>
            <h2 style={{ fontSize: '24px', fontWeight: '700', color: colors.textMain, margin: 0 }}>{profile.name}</h2>
            <p style={{ color: colors.textMuted, fontSize: '14px', margin: '4px 0 0' }}>{profile.email}</p>
            <span style={{
              display: 'inline-block', marginTop: '6px', padding: '3px 12px', borderRadius: '20px', fontWeight: '600', fontSize: '12px',
              backgroundColor: profile.role === 'admin' ? '#ef444433' : '#8b5cf633',
              color: profile.role === 'admin' ? '#ef4444' : '#8b5cf6',
              border: `1px solid ${profile.role === 'admin' ? '#ef4444' : '#8b5cf6'}`
            }}>
              {profile.role === 'admin' ? '🛡️ Admin' : '👤 Attendee'}
            </span>
          </div>
        </div>

        {/* TABS */}
        <div style={{ display: 'flex', gap: '4px', marginBottom: '24px', borderBottom: `1px solid ${colors.border}` }}>
          {['profile', 'security'].map(tab => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              style={{
                padding: '10px 20px', background: 'none', border: 'none', cursor: 'pointer',
                fontSize: '14px', fontWeight: '600',
                color: activeTab === tab ? colors.accent : colors.textMuted,
                borderBottom: activeTab === tab ? `2px solid ${colors.accent}` : '2px solid transparent',
                marginBottom: '-1px', transition: 'all 0.2s'
              }}
            >
              {tab === 'profile' ? '👤 Profile' : '🔒 Security'}
            </button>
          ))}
        </div>

        {/* TAB CONTENT */}
        <div style={{ backgroundColor: colors.cardBg, padding: '32px', borderRadius: '16px', border: `1px solid ${colors.border}` }}>

          {activeTab === 'profile' && (
            <div>
              <h3 style={{ color: colors.textMain, fontSize: '16px', fontWeight: '700', marginTop: 0, marginBottom: '24px' }}>Personal Information</h3>

              <div style={{ marginBottom: '20px' }}>
                <label style={{ fontSize: '13px', fontWeight: '600', color: colors.textMuted }}>Full Name</label>
                <input value={name} onChange={e => setName(e.target.value)} style={inputStyle} />
              </div>

              <div style={{ marginBottom: '20px' }}>
                <label style={{ fontSize: '13px', fontWeight: '600', color: colors.textMuted }}>Email Address</label>
                <input value={profile.email} disabled style={{ ...inputStyle, opacity: 0.5, cursor: 'not-allowed' }} />
                <p style={{ fontSize: '12px', color: colors.textMuted, marginTop: '4px' }}>Email cannot be changed.</p>
              </div>

              <div style={{ marginBottom: '28px' }}>
                <label style={{ fontSize: '13px', fontWeight: '600', color: colors.textMuted, display: 'block', marginBottom: '8px' }}>Role</label>
                <span style={{
                  display: 'inline-block', padding: '6px 16px', borderRadius: '20px', fontWeight: '600', fontSize: '13px',
                  backgroundColor: profile.role === 'admin' ? '#ef444433' : '#8b5cf633',
                  color: profile.role === 'admin' ? '#ef4444' : '#8b5cf6',
                  border: `1px solid ${profile.role === 'admin' ? '#ef4444' : '#8b5cf6'}`
                }}>
                  {profile.role === 'admin' ? '🛡️ Admin' : '👤 Attendee'}
                </span>
                <p style={{ fontSize: '12px', color: colors.textMuted, marginTop: '6px' }}>Role is assigned during registration.</p>
              </div>

              <button onClick={handleSave} style={{ padding: '12px 28px', backgroundColor: colors.accent, color: '#fff', border: 'none', borderRadius: '8px', fontSize: '14px', fontWeight: '600', cursor: 'pointer' }}>
                Save Changes
              </button>
              {saveMsg && <p style={{ color: saveMsg.includes("❌") ? colors.error : '#10b981', marginTop: '12px', fontSize: '14px' }}>{saveMsg}</p>}
            </div>
          )}

          {activeTab === 'security' && (
            <div>
              <h3 style={{ color: colors.textMain, fontSize: '16px', fontWeight: '700', marginTop: 0, marginBottom: '8px' }}>Change Password</h3>
              <p style={{ color: colors.textMuted, fontSize: '13px', marginBottom: '24px' }}>Make sure your password is strong and unique.</p>

              <div style={{ marginBottom: '16px' }}>
                <label style={{ fontSize: '13px', fontWeight: '600', color: colors.textMuted }}>Current Password</label>
                <PasswordInput value={currentPassword} onChange={e => setCurrentPassword(e.target.value)} />
              </div>

              <div style={{ marginBottom: '8px' }}>
                <label style={{ fontSize: '13px', fontWeight: '600', color: colors.textMuted }}>New Password</label>
                <PasswordInput value={newPassword} onChange={e => setNewPassword(e.target.value)} placeholder="Minimum 8 characters" />
              </div>

              {newPassword && (
                <div style={{ marginBottom: '16px' }}>
                  <div style={{ height: '4px', backgroundColor: colors.border, borderRadius: '4px', marginBottom: '4px' }}>
                    <div style={{ height: '100%', width: strength.width, backgroundColor: strength.color, borderRadius: '4px', transition: 'all 0.3s' }} />
                  </div>
                  <p style={{ fontSize: '12px', color: strength.color, margin: 0 }}>
                    Password strength: <strong>{strength.label}</strong>
                  </p>
                </div>
              )}

              <div style={{ marginBottom: '24px' }}>
                <label style={{ fontSize: '13px', fontWeight: '600', color: colors.textMuted }}>Confirm New Password</label>
                <PasswordInput value={confirmPassword} onChange={e => setConfirmPassword(e.target.value)} />
                {confirmPassword && newPassword !== confirmPassword && (
                  <p style={{ color: colors.error, fontSize: '12px', marginTop: '4px' }}>❌ Passwords do not match</p>
                )}
                {confirmPassword && newPassword === confirmPassword && (
                  <p style={{ color: '#10b981', fontSize: '12px', marginTop: '4px' }}>✓ Passwords match</p>
                )}
              </div>

              <button onClick={handleChangePassword} style={{ padding: '12px 28px', backgroundColor: colors.accentGreen, color: '#fff', border: 'none', borderRadius: '8px', fontSize: '14px', fontWeight: '600', cursor: 'pointer' }}>
                Update Password
              </button>
              {passwordMsg && <p style={{ color: passwordMsg.includes("❌") ? colors.error : '#10b981', marginTop: '12px', fontSize: '14px' }}>{passwordMsg}</p>}
            </div>
          )}

        </div>
      </div>
    </div>
  )
}