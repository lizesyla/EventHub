import { useNavigate } from 'react-router-dom'
import { useState } from "react"

function CreateEvent() {
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [date, setDate] = useState('')
  const [location, setLocation] = useState('')
  const [capacity, setCapacity] = useState('')
  const [banner, setBanner] = useState(null)
  const [errors, setErrors] = useState({})
  const [success, setSuccess] = useState('')
  const [statusNote, setStatusNote] = useState("")
  const [loading, setLoading] = useState(false)
  const navigate = useNavigate()

  const colors = {
    bgDark: "#0f0c1b",
    cardBg: "#1a162e",
    inputBg: "#252142",
    textMain: "#ffffff",
    textMuted: "#b3b0cd",
    accent: "#8b5cf6",
    border: "#2d294e",
    error: "#ef4444",
    green: "#10b981",
  }

  const inputStyle = {
    width: "100%",
    padding: "12px",
    borderRadius: "8px",
    border: `1px solid ${colors.border}`,
    backgroundColor: colors.inputBg,
    color: colors.textMain,
    fontSize: "14px",
    marginTop: "6px",
    boxSizing: "border-box",
    outline: "none",
  }

  const validateForm = () => {
    const localErrors = {}
    const capacityNumber = Number(capacity)

    if (!title.trim() || title.trim().length < 3) localErrors.title = "Title must be at least 3 characters."
    if (!date) localErrors.date = "Date is required."
    if (!location.trim()) localErrors.location = "Location is required."
    if (capacity && (!Number.isInteger(capacityNumber) || capacityNumber < 1)) {
      localErrors.capacity = "Capacity must be a whole number of at least 1."
    }
    if (banner && !banner.type.startsWith('image/')) localErrors.banner = "Only image files are allowed."

    setErrors(localErrors)
    return Object.keys(localErrors).length === 0
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!validateForm()) return

    const token = localStorage.getItem("token")
    if (!token) {
      alert("You must be logged in to create an event.")
      return
    }

    setLoading(true)
    const formData = new FormData()
    formData.append('title', title.trim())
    formData.append('description', description)
    formData.append('date_time', date)
    formData.append('location', location.trim())
    if (capacity) formData.append('capacity', capacity)
    if (banner) formData.append('banner', banner)

    try {
      const response = await fetch('http://localhost:8000/api/events', {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` },
        body: formData,
      })
      const data = await response.json().catch(() => ({}))

      const data = await response.json().catch(() => ({}))

      if (response.ok) {
        const reviewStatus = data.review_status || "pending"

        setSuccess("Event submitted successfully!")
        setStatusNote(
          reviewStatus === "pending"
            ? "Event sent for admin approval."
            : "Event published immediately."
        )
        setTitle("")
        setDescription("")
        setDate("")
        setLocation("")
        setCapacity("")
        setBanner(null)
        setErrors({})

        alert(reviewStatus === "pending" ? "Event sent for approval!" : "Event created successfully!")
        setTimeout(() => {
          navigate('/my-events')
        }, 1500)
      } else {
        alert(`Error: ${data.detail || 'Something went wrong'}`)
      }
    } catch {
      alert("Could not connect to the server.")
    } finally {
      setLoading(false)
    }
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
        <div style={{ marginBottom: '32px' }}>
          <p style={{ color: colors.accent, fontSize: '12px', fontWeight: '700', letterSpacing: '3px', textTransform: 'uppercase', margin: '0 0 12px' }}>EVENT SUBMISSION</p>
          <h2 style={{ fontSize: '28px', fontWeight: '800', color: colors.textMain, margin: '0 0 8px', letterSpacing: '-0.5px' }}>Create New Event</h2>
          <p style={{ color: colors.textMuted, fontSize: '14px', margin: 0 }}>Fill in the details below to send your event for review.</p>
        </div>

        {success && (
          <div style={{ padding: '14px 16px', backgroundColor: 'rgba(16,185,129,0.1)', border: '1px solid rgba(16,185,129,0.3)', borderRadius: '10px', color: colors.green, fontSize: '14px', fontWeight: '600', marginBottom: '24px' }}>
            {success} Redirecting to My Events...
          </div>
        )}

        <p style={{ color: colors.textMuted, fontSize: "14px", marginBottom: "24px" }}>
          Submitted events stay pending until an admin approves them.
        </p>

        {success && (
          <div style={{ padding: "14px 16px", backgroundColor: "rgba(16,185,129,0.1)", border: "1px solid rgba(16,185,129,0.3)", borderRadius: "10px", color: colors.green, fontSize: "14px", fontWeight: "600", marginBottom: "24px" }}>
            {success} Redirecting to My Events...
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <div style={{ marginBottom: '20px' }}>
            <label style={{ fontSize: '13px', fontWeight: '600', color: colors.textMuted }}>Event Title *</label>
            <input type="text" value={title} onChange={e => setTitle(e.target.value)} placeholder="e.g. Tech Talk 2026" style={inputStyle} />
            {errors.title && <span style={{ color: colors.error, fontSize: '12px', marginTop: '4px', display: 'block' }}>{errors.title}</span>}
          </div>

          <div style={{ marginBottom: '20px' }}>
            <label style={{ fontSize: '13px', fontWeight: '600', color: colors.textMuted }}>Description</label>
            <textarea value={description} onChange={e => setDescription(e.target.value)} placeholder="Tell people what this event is about..." style={{ ...inputStyle, height: '100px', resize: 'vertical' }} />
          </div>

          <div style={{ marginBottom: '20px' }}>
            <label style={{ fontSize: '13px', fontWeight: '600', color: colors.textMuted }}>Date & Time *</label>
            <input type="datetime-local" value={date} onChange={e => setDate(e.target.value)} style={inputStyle} />
            {errors.date && <span style={{ color: colors.error, fontSize: '12px', marginTop: '4px', display: 'block' }}>{errors.date}</span>}
          </div>

          <div style={{ marginBottom: '20px' }}>
            <label style={{ fontSize: '13px', fontWeight: '600', color: colors.textMuted }}>Location *</label>
            <input type="text" value={location} onChange={e => setLocation(e.target.value)} placeholder="e.g. Conference Room A" style={inputStyle} />
            {errors.location && <span style={{ color: colors.error, fontSize: '12px', marginTop: '4px', display: 'block' }}>{errors.location}</span>}
          </div>

          <div style={{ marginBottom: '20px' }}>
            <label style={{ fontSize: '13px', fontWeight: '600', color: colors.textMuted }}>Capacity <span style={{ color: colors.textMuted, fontWeight: '400' }}>(optional)</span></label>
            <input type="number" value={capacity} onChange={e => setCapacity(e.target.value)} placeholder="e.g. 50" style={inputStyle} min="1" step="1" />
            {errors.capacity && <span style={{ color: colors.error, fontSize: '12px', marginTop: '4px', display: 'block' }}>{errors.capacity}</span>}
          </div>

          <div style={{ marginBottom: '32px' }}>
            <label style={{ fontSize: '13px', fontWeight: '600', color: colors.textMuted }}>Banner Image <span style={{ color: colors.textMuted, fontWeight: '400' }}>(optional)</span></label>
            <div style={{ border: `2px dashed ${colors.border}`, padding: '20px', borderRadius: '10px', marginTop: '6px', backgroundColor: colors.inputBg, textAlign: 'center', cursor: 'pointer' }}>
              <p style={{ color: colors.textMuted, fontSize: '13px', margin: '0 0 8px' }}>Click to upload image</p>
              <input type="file" accept="image/*" onChange={e => setBanner(e.target.files[0] || null)} style={{ color: colors.textMuted, fontSize: '13px' }} />
              {banner && <p style={{ color: colors.green, fontSize: '12px', margin: '8px 0 0', fontWeight: '600' }}>{banner.name}</p>}
            </div>
            {errors.banner && <span style={{ color: colors.error, fontSize: "12px", marginTop: "4px", display: "block" }}>{errors.banner}</span>}
          </div>

          <div style={{ display: 'flex', gap: '12px' }}>
            <button type="button" onClick={() => navigate('/my-events')} style={{
              flex: 1, padding: '14px', backgroundColor: 'transparent', color: colors.textMuted,
              border: `1px solid ${colors.border}`, borderRadius: '10px', fontSize: '14px',
              fontWeight: '600', cursor: 'pointer'
            }}>
              Back
            </button>
            <button type="submit" disabled={loading} style={{
              flex: 2, padding: '14px', backgroundColor: loading ? '#4338ca' : colors.accent,
              color: '#fff', border: 'none', borderRadius: '10px', fontSize: '15px',
              fontWeight: '700', cursor: loading ? 'not-allowed' : 'pointer',
              boxShadow: '0 4px 20px rgba(99,102,241,0.4)'
            }}>
              {loading ? 'Publishing...' : 'Publish Event'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

export default CreateEvent
