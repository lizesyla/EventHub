import { useState } from 'react'
import { useNavigate } from 'react-router-dom'

function CreateEvent() {
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [date, setDate] = useState('')
  const [location, setLocation] = useState('')
  const [capacity, setCapacity] = useState('')
  const [banner, setBanner] = useState(null)
  const [errors, setErrors] = useState({})
  const [success, setSuccess] = useState('')
  const [loading, setLoading] = useState(false)
  const navigate = useNavigate()

  const validateForm = () => {
    let localErrors = {}
    if (!title.trim() || title.length < 3) localErrors.title = "Title must be at least 3 characters."
    if (!date) localErrors.date = "Date is required."
    if (!location.trim()) localErrors.location = "Location is required."
    if (banner && !banner.type.startsWith('image/')) localErrors.banner = "Only image files are allowed."
    setErrors(localErrors)
    return Object.keys(localErrors).length === 0
  }

  const handleSubmit = async (e) => {
    e.preventDefault()

    if (!validateForm()) return

    const token = localStorage.getItem("token")
    if (!token) {
      alert("You must be logged in as an Organizer!")
      return
    }

    setLoading(true)
    const formData = new FormData()
    formData.append('title', title)
    formData.append('description', description)
    formData.append('date_time', date)
    formData.append('location', location)
    if (capacity) formData.append('capacity', capacity)
    if (banner) formData.append('banner', banner)

    try {
      const response = await fetch('http://localhost:8000/api/events', {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` },
        body: formData,
      })

      if (response.ok) {
        setSuccess("Event published successfully!")
        setTitle('')
        setDescription('')
        setDate('')
        setLocation('')
        setCapacity('')
        setBanner(null)
        setErrors({})
        setTimeout(() => {
          navigate('/organizer')
        }, 1500)
      } else {
        const errorData = await response.json()
        alert(`Error: ${errorData.detail || 'Something went wrong'}`)
      }
    } catch {
      alert("Could not connect to the server.")
    } finally {
      setLoading(false)
    }
  }

  const colors = {
    bgDark: '#0f172a',
    cardBg: '#1e293b',
    inputBg: '#0f172a',
    textMain: '#ffffff',
    textMuted: '#94a3b8',
    accent: '#6366f1',
    border: '#334155',
    error: '#ef4444',
    green: '#10b981',
  }

  const inputStyle = {
    width: '100%',
    padding: '12px 14px',
    borderRadius: '10px',
    border: `1px solid ${colors.border}`,
    backgroundColor: colors.inputBg,
    color: colors.textMain,
    fontSize: '14px',
    marginTop: '6px',
    boxSizing: 'border-box',
    outline: 'none',
  }

  return (
    <div style={{
      backgroundColor: colors.bgDark,
      minHeight: '100vh',
      padding: '60px 20px',
      fontFamily: "'Inter', sans-serif",
      display: 'flex',
      alignItems: 'flex-start',
      justifyContent: 'center',
    }}>
      <div style={{
        width: '100%',
        maxWidth: '520px',
        backgroundColor: colors.cardBg,
        padding: '40px',
        borderRadius: '24px',
        border: `1px solid ${colors.border}`,
      }}>

        {/* Header */}
        <div style={{ marginBottom: '32px' }}>
          <p style={{ color: colors.accent, fontSize: '12px', fontWeight: '700', letterSpacing: '3px', textTransform: 'uppercase', margin: '0 0 12px' }}>ORGANIZER</p>
          <h2 style={{ fontSize: '28px', fontWeight: '800', color: colors.textMain, margin: '0 0 8px', letterSpacing: '-0.5px' }}>Create New Event</h2>
          <p style={{ color: colors.textMuted, fontSize: '14px', margin: 0 }}>Fill in the details below to publish your event.</p>
        </div>

        {/* Success */}
        {success && (
          <div style={{ padding: '14px 16px', backgroundColor: 'rgba(16,185,129,0.1)', border: '1px solid rgba(16,185,129,0.3)', borderRadius: '10px', color: colors.green, fontSize: '14px', fontWeight: '600', marginBottom: '24px', display: 'flex', alignItems: 'center', gap: '8px' }}>
            ✅ {success} — Redirecting to My Events...
          </div>
        )}

        <form onSubmit={handleSubmit}>

          {/* Title */}
          <div style={{ marginBottom: '20px' }}>
            <label style={{ fontSize: '13px', fontWeight: '600', color: colors.textMuted }}>Event Title *</label>
            <input type="text" value={title} onChange={e => setTitle(e.target.value)} placeholder="e.g. Tech Talk 2026" style={inputStyle} />
            {errors.title && <span style={{ color: colors.error, fontSize: '12px', marginTop: '4px', display: 'block' }}>{errors.title}</span>}
          </div>

          {/* Description */}
          <div style={{ marginBottom: '20px' }}>
            <label style={{ fontSize: '13px', fontWeight: '600', color: colors.textMuted }}>Description</label>
            <textarea value={description} onChange={e => setDescription(e.target.value)} placeholder="Tell people what this event is about..." style={{ ...inputStyle, height: '100px', resize: 'vertical' }} />
          </div>

          {/* Date */}
          <div style={{ marginBottom: '20px' }}>
            <label style={{ fontSize: '13px', fontWeight: '600', color: colors.textMuted }}>Date & Time *</label>
            <input type="datetime-local" value={date} onChange={e => setDate(e.target.value)} style={inputStyle} />
            {errors.date && <span style={{ color: colors.error, fontSize: '12px', marginTop: '4px', display: 'block' }}>{errors.date}</span>}
          </div>

          {/* Location */}
          <div style={{ marginBottom: '20px' }}>
            <label style={{ fontSize: '13px', fontWeight: '600', color: colors.textMuted }}>Location *</label>
            <input type="text" value={location} onChange={e => setLocation(e.target.value)} placeholder="e.g. Conference Room A" style={inputStyle} />
            {errors.location && <span style={{ color: colors.error, fontSize: '12px', marginTop: '4px', display: 'block' }}>{errors.location}</span>}
          </div>

          {/* Capacity */}
          <div style={{ marginBottom: '20px' }}>
            <label style={{ fontSize: '13px', fontWeight: '600', color: colors.textMuted }}>Capacity <span style={{ color: colors.textMuted, fontWeight: '400' }}>(optional)</span></label>
            <input type="number" value={capacity} onChange={e => setCapacity(e.target.value)} placeholder="e.g. 50" style={inputStyle} min="1" />
          </div>

          {/* Banner */}
          <div style={{ marginBottom: '32px' }}>
            <label style={{ fontSize: '13px', fontWeight: '600', color: colors.textMuted }}>Banner Image <span style={{ color: colors.textMuted, fontWeight: '400' }}>(optional)</span></label>
            <div style={{ border: `2px dashed ${colors.border}`, padding: '20px', borderRadius: '10px', marginTop: '6px', backgroundColor: colors.inputBg, textAlign: 'center', cursor: 'pointer' }}>
              <p style={{ color: colors.textMuted, fontSize: '13px', margin: '0 0 8px' }}>📸 Click to upload image</p>
              <input type="file" accept="image/*" onChange={e => setBanner(e.target.files[0] || null)} style={{ color: colors.textMuted, fontSize: '13px' }} />
              {banner && <p style={{ color: colors.green, fontSize: '12px', margin: '8px 0 0', fontWeight: '600' }}>✅ {banner.name}</p>}
            </div>
            {errors.banner && (
              <span style={{ color: colors.error, fontSize: "12px", marginTop: "4px", display: "block" }}>
                {errors.banner}
              </span>
            )}
          </div>

          {/* Buttons */}
          <div style={{ display: 'flex', gap: '12px' }}>
            <button type="button" onClick={() => navigate('/organizer')} style={{
              flex: 1, padding: '14px', backgroundColor: 'transparent', color: colors.textMuted,
              border: `1px solid ${colors.border}`, borderRadius: '10px', fontSize: '14px',
              fontWeight: '600', cursor: 'pointer'
            }}>
              ← Back
            </button>
            <button type="submit" disabled={loading} style={{
              flex: 2, padding: '14px', backgroundColor: loading ? '#4338ca' : colors.accent,
              color: '#fff', border: 'none', borderRadius: '10px', fontSize: '15px',
              fontWeight: '700', cursor: loading ? 'not-allowed' : 'pointer',
              boxShadow: '0 4px 20px rgba(99,102,241,0.4)'
            }}>
              {loading ? 'Publishing...' : 'Publish Event →'}
            </button>
          </div>

        </form>
      </div>
    </div>
  )
}

export default CreateEvent
