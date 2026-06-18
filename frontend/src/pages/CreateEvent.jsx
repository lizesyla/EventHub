import { useState, useEffect } from "react"

function CreateEvent() {
  const [title, setTitle] = useState("")
  const [description, setDescription] = useState("")
  const [date, setDate] = useState("")
  const [location, setLocation] = useState("")
  const [capacity, setCapacity] = useState("")
  const [banner, setBanner] = useState(null)
  const [errors, setErrors] = useState({})
  const [events, setEvents] = useState([])

  const colors = {
    bgDark: "#0f0c1b",
    cardBg: "#1a162e",
    inputBg: "#252142",
    textMain: "#ffffff",
    textMuted: "#b3b0cd",
    accent: "#8b5cf6",
    accentHover: "#7c3aed",
    border: "#2d294e",
    error: "#ef4444",
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

  const getAuthHeaders = () => {
    const token = localStorage.getItem("token")
    return token ? { Authorization: `Bearer ${token}` } : {}
  }

  const fetchEvents = async () => {
    try {
      const res = await fetch("http://localhost:8000/api/events", {
        headers: getAuthHeaders(),
      })

      if (res.ok) {
        const data = await res.json()
        setEvents(Array.isArray(data) ? data : [])
      }
    } catch (err) {
      console.error("Gabim gjatë marrjes së eventeve:", err)
    }
  }

  useEffect(() => {
    fetchEvents()
  }, [])

  const validateForm = () => {
    const localErrors = {}

    if (!title.trim() || title.length < 3) {
      localErrors.title = "Titulli duhet të ketë së paku 3 karaktere."
    }

    if (!date) {
      localErrors.date = "Data është e detyrueshme."
    }

    if (!location.trim()) {
      localErrors.location = "Lokacioni është i detyrueshëm."
    }

    if (!capacity || Number(capacity) < 1) {
      localErrors.capacity = "Kapaciteti duhet të jetë së paku 1."
    }

    if (banner && !banner.type.startsWith("image/")) {
      localErrors.banner = "Lejohen vetëm skedarët imazh."
    }

    setErrors(localErrors)
    return Object.keys(localErrors).length === 0
  }

  const handleSubmit = async (e) => {
    e.preventDefault()

    if (!validateForm()) return

    const token = localStorage.getItem("token")

    if (!token) {
      alert("Gabim: Not authenticated. Ju lutem bëni login përsëri.")
      return
    }

    const formData = new FormData()
    formData.append("title", title)
    formData.append("description", description)
    formData.append("date_time", date)
    formData.append("location", location)
    formData.append("capacity", capacity)

    if (banner) {
      formData.append("banner", banner)
    }

    try {
      const response = await fetch("http://localhost:8000/api/events", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
        },
        body: formData,
      })

      if (response.ok) {
        alert("Eventi u krijua me sukses!")
        setTitle("")
        setDescription("")
        setDate("")
        setLocation("")
        setCapacity("")
        setBanner(null)
        fetchEvents()
      } else {
        const errorData = await response.json()
        alert(`Gabim: ${errorData.detail || "Diçka shkoi keq"}`)
      }
    } catch (err) {
      console.error(err)
      alert("Nuk u realizua lidhja me serverin.")
    }
  }

  return (
    <div
      style={{
        backgroundColor: colors.bgDark,
        color: colors.textMain,
        minHeight: "100vh",
        padding: "40px 20px",
        fontFamily: "'Inter', system-ui, sans-serif",
        display: "flex",
        justifyContent: "center",
        gap: "40px",
        flexWrap: "wrap",
      }}
    >
      <div
        style={{
          flex: "1",
          minWidth: "320px",
          maxWidth: "450px",
          backgroundColor: colors.cardBg,
          padding: "30px",
          borderRadius: "16px",
          boxShadow: "0 10px 25px rgba(0, 0, 0, 0.3)",
          border: `1px solid ${colors.border}`,
          height: "fit-content",
        }}
      >
        <h2 style={{ fontSize: "24px", marginBottom: "8px", fontWeight: "700" }}>
          Krijo Event
        </h2>

        <p style={{ color: colors.textMuted, fontSize: "14px", marginBottom: "24px" }}>
          Plotësoni detajet e mëposhtme për të publikuar eventin tuaj të ri.
        </p>

        <form onSubmit={handleSubmit}>
          <div style={{ marginBottom: "18px" }}>
            <label style={{ fontSize: "14px", fontWeight: "600", color: colors.textMuted }}>
              Titulli i Eventit *
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="P.sh. Hackathon 2026"
              style={inputStyle}
            />
            {errors.title && (
              <span style={{ color: colors.error, fontSize: "12px", marginTop: "4px", display: "block" }}>
                {errors.title}
              </span>
            )}
          </div>

          <div style={{ marginBottom: "18px" }}>
            <label style={{ fontSize: "14px", fontWeight: "600", color: colors.textMuted }}>
              Përshkrimi
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Tregoni më shumë rreth organizimit..."
              style={{ ...inputStyle, height: "100px", resize: "vertical" }}
            />
          </div>

          <div style={{ marginBottom: "18px" }}>
            <label style={{ fontSize: "14px", fontWeight: "600", color: colors.textMuted }}>
              Data dhe Koha *
            </label>
            <input
              type="datetime-local"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              style={inputStyle}
            />
            {errors.date && (
              <span style={{ color: colors.error, fontSize: "12px", marginTop: "4px", display: "block" }}>
                {errors.date}
              </span>
            )}
          </div>

          <div style={{ marginBottom: "18px" }}>
            <label style={{ fontSize: "14px", fontWeight: "600", color: colors.textMuted }}>
              Lokacioni *
            </label>
            <input
              type="text"
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              placeholder="P.sh. Amfiteatri i FIEK"
              style={inputStyle}
            />
            {errors.location && (
              <span style={{ color: colors.error, fontSize: "12px", marginTop: "4px", display: "block" }}>
                {errors.location}
              </span>
            )}
          </div>

          <div style={{ marginBottom: "18px" }}>
            <label style={{ fontSize: "14px", fontWeight: "600", color: colors.textMuted }}>
              Kapaciteti *
            </label>
            <input
              type="number"
              min="1"
              value={capacity}
              onChange={(e) => setCapacity(e.target.value)}
              placeholder="P.sh. 50"
              style={inputStyle}
            />
            {errors.capacity && (
              <span style={{ color: colors.error, fontSize: "12px", marginTop: "4px", display: "block" }}>
                {errors.capacity}
              </span>
            )}
          </div>

          <div style={{ marginBottom: "24px" }}>
            <label style={{ fontSize: "14px", fontWeight: "600", color: colors.textMuted }}>
              Kopertina (Banner Image)
            </label>
            <div
              style={{
                border: `2px dashed ${colors.border}`,
                padding: "15px",
                borderRadius: "8px",
                marginTop: "6px",
                backgroundColor: colors.bgDark,
                textAlign: "center",
              }}
            >
              <input
                type="file"
                accept="image/*"
                onChange={(e) => setBanner(e.target.files[0] || null)}
                style={{ color: colors.textMuted, fontSize: "13px" }}
              />
            </div>
            {errors.banner && (
              <span style={{ color: colors.error, fontSize: "12px", marginTop: "4px", display: "block" }}>
                {errors.banner}
              </span>
            )}
          </div>

          <button
            type="submit"
            style={{
              width: "100%",
              padding: "14px",
              backgroundColor: colors.accent,
              color: "#fff",
              border: "none",
              borderRadius: "8px",
              fontSize: "16px",
              fontWeight: "600",
              cursor: "pointer",
              boxShadow: "0 4px 14px rgba(139, 92, 246, 0.4)",
            }}
          >
            Publiko Eventin
          </button>
        </form>
      </div>

      <div style={{ flex: "2", minWidth: "350px", maxWidth: "800px" }}>
        <h2 style={{ fontSize: "24px", marginBottom: "8px", fontWeight: "700" }}>
          Event Board
        </h2>

        <p style={{ color: colors.textMuted, fontSize: "14px", marginBottom: "24px" }}>
          Lista e të gjitha ngjarjeve aktive të krijuara brenda platformës.
        </p>

        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))",
            gap: "20px",
          }}
        >
          {events.length === 0 ? (
            <div
              style={{
                gridColumn: "1/-1",
                textAlign: "center",
                padding: "40px",
                backgroundColor: colors.cardBg,
                borderRadius: "12px",
                border: `1px solid ${colors.border}`,
              }}
            >
              <p style={{ color: colors.textMuted, margin: 0 }}>
                Nuk ka asnjë event të krijuar ende.
              </p>
            </div>
          ) : (
            events.map((event) => (
              <div
                key={event.id}
                style={{
                  backgroundColor: colors.cardBg,
                  borderRadius: "12px",
                  overflow: "hidden",
                  boxShadow: "0 4px 15px rgba(0,0,0,0.2)",
                  border: `1px solid ${colors.border}`,
                  display: "flex",
                  flexDirection: "column",
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
                      color: colors.textMuted,
                      fontSize: "14px",
                    }}
                  >
                    🖼️ Pa Kopertinë
                  </div>
                )}

                <div
                  style={{
                    padding: "20px",
                    flexGrow: 1,
                    display: "flex",
                    flexDirection: "column",
                    justifyContent: "space-between",
                  }}
                >
                  <div>
                    <h3 style={{ margin: "0 0 10px 0", fontSize: "18px", fontWeight: "600" }}>
                      {event.title}
                    </h3>

                    <p style={{ fontSize: "13px", color: colors.textMuted, margin: "0 0 12px 0", lineHeight: "1.5" }}>
                      <span>📍 {event.location}</span>
                      <br />
                      <span>
                        📅{" "}
                        {event.date_time
                          ? new Date(event.date_time).toLocaleString("sq-AL", {
                              dateStyle: "medium",
                              timeStyle: "short",
                            })
                          : ""}
                      </span>
                    </p>

                    <p style={{ margin: "0 0 8px 0", fontSize: "14px", color: colors.textMuted }}>
                      {event.description}
                    </p>

                    <p style={{ margin: 0, fontSize: "13px", color: colors.textMuted }}>
                      👥 Capacity: {event.capacity ?? "N/A"}
                    </p>
                  </div>
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