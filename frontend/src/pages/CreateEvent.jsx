import { useState, useEffect } from 'react'

function CreateEvent() {
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [date, setDate] = useState('')
  const [location, setLocation] = useState('')
  const [banner, setBanner] = useState(null)
  const [errors, setErrors] = useState({})
  const [events, setEvents] = useState([])

  const fetchEvents = async () => {
    try {
      const res = await fetch('http://localhost:8000/api/events')
      if (res.ok) {
        const data = await res.json()
        setEvents(data)
      }
    } catch (err) {
      console.error("Gabim gjatë marrjes së eventeve:", err)
    }
  }

  useEffect(() => {
    let isMounted = true
    const loadInitialData = async () => {
      try {
        const res = await fetch('http://localhost:8000/api/events')
        if (res.ok) {
          const data = await res.json()
          if (isMounted) setEvents(data)
        }
      } catch (err) {
        console.error("Gabim gjatë ngarkimit fillestar:", err)
      }
    }
    loadInitialData()
    return () => { isMounted = false }
  }, [])

  const validateForm = () => {
    let localErrors = {}
    if (!title.trim() || title.length < 3) localErrors.title = "Titulli duhet të ketë së paku 3 karaktere."
    if (!date) localErrors.date = "Data është e detyrueshme."
    if (!location.trim()) localErrors.location = "Lokacioni është i detyrueshëm."
    if (banner && !banner.type.startsWith('image/')) localErrors.banner = "Lejohen vetëm skedarët imazh."
    
    setErrors(localErrors)
    return Object.keys(localErrors).length === 0
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!validateForm()) return

    const formData = new FormData()
    formData.append('title', title)
    formData.append('description', description)
    formData.append('date', date)
    formData.append('location', location)
    if (banner) formData.append('banner', banner)

    try {
      const response = await fetch('http://localhost:8000/api/events', {
        method: 'POST',
        body: formData,
      })

      if (response.ok) {
        alert("Eventi u krijua me sukses!")
        setTitle('')
        setDescription('')
        setDate('')
        setLocation('')
        setBanner(null)
        fetchEvents()
      } else {
        const errorData = await response.json()
        alert(`Gabim: ${errorData.detail || 'Diçka shkoi keq'}`)
      }
    } catch (err) {
      console.error(err)
      alert("Nuk u realizua lidhja me serverin.")
    }
  }

  return (
    <div style={{ padding: '20px', display: 'flex', gap: '40px' }}>
      <div style={{ flex: 1, maxWidth: '400px', border: '1px solid #ccc', padding: '20px', borderRadius: '8px' }}>
        <h2>Krijo Event të Ri</h2>
        <form onSubmit={handleSubmit}>
          <div style={{ marginBottom: '12px' }}>
            <label>Titulli: *</label><br />
            <input type="text" value={title} onChange={(e) => setTitle(e.target.value)} style={{ width: '100%', padding: '6px' }} />
            {errors.title && <span style={{ color: 'red', fontSize: '12px' }}>{errors.title}</span>}
          </div>
          <div style={{ marginBottom: '12px' }}>
            <label>Përshkrimi:</label><br />
            <textarea value={description} onChange={(e) => setDescription(e.target.value)} style={{ width: '100%', padding: '6px' }} />
          </div>
          <div style={{ marginBottom: '12px' }}>
            <label>Data dhe Koha: *</label><br />
            <input type="datetime-local" value={date} onChange={(e) => setDate(e.target.value)} style={{ width: '100%', padding: '6px' }} />
            {errors.date && <span style={{ color: 'red', fontSize: '12px' }}>{errors.date}</span>}
          </div>
          <div style={{ marginBottom: '12px' }}>
            <label>Lokacioni: *</label><br />
            <input type="text" value={location} onChange={(e) => setLocation(e.target.value)} style={{ width: '100%', padding: '6px' }} />
            {errors.location && <span style={{ color: 'red', fontSize: '12px' }}>{errors.location}</span>}
          </div>
          <div style={{ marginBottom: '20px' }}>
            <label>Banner Image:</label><br />
            <input type="file" accept="image/*" onChange={(e) => setBanner(e.target.files[0] || null)} />
            {errors.banner && <span style={{ color: 'red', fontSize: '12px' }}>{errors.banner}</span>}
          </div>
          <button type="submit" style={{ padding: '10px 20px', background: '#28a745', color: '#fff', border: 'none', borderRadius: '4px', cursor: 'pointer', width: '100%' }}>
            Krijo Eventin
          </button>
        </form>
      </div>

      <div style={{ flex: 2 }}>
        <h2>Event Board</h2>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
          {events.length === 0 ? (
            <p>Nuk ka asnjë event të krijuar ende.</p>
          ) : (
            events.map(event => (
              <div key={event.id} style={{ border: '1px solid #ddd', borderRadius: '8px', overflow: 'hidden' }}>
                {event.banner_url && <img src={event.banner_url} alt="Banner" style={{ width: '100%', height: '150px', objectFit: 'cover' }} />}
                <div style={{ padding: '15px' }}>
                  <h3>{event.title}</h3>
                  <p style={{ fontSize: '13px', color: '#666' }}>📍 {event.location} | 📅 {new Date(event.date).toLocaleString()}</p>
                  <p>{event.description}</p>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  )
}

export default CreateEvent