import { useState } from "react"

const mockUser = {
  name: "Arta Krasniqi",
  email: "arta@company.com",
  role: "attendee"
}

export default function Profile() {
  const [name, setName] = useState(mockUser.name)
  const [role, setRole] = useState(mockUser.role)
  const [saved, setSaved] = useState(false)
  const [currentPassword, setCurrentPassword] = useState("")
  const [newPassword, setNewPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [passwordMsg, setPasswordMsg] = useState("")

  function handleSave() {
    setSaved(true)
    setTimeout(() => setSaved(false), 2000)
  }

  function handleChangePassword() {
    if (!currentPassword || !newPassword || !confirmPassword) {
      setPasswordMsg("❌ Plotëso të gjitha fushat")
      return
    }
    if (newPassword !== confirmPassword) {
      setPasswordMsg("❌ Fjalëkalimet nuk përputhen")
      return
    }
    setPasswordMsg("✅ Fjalëkalimi u ndryshua!")
    setCurrentPassword("")
    setNewPassword("")
    setConfirmPassword("")
    setTimeout(() => setPasswordMsg(""), 2000)
  }

  return (
    <div style={{ maxWidth: "400px", margin: "40px auto", padding: "24px", border: "1px solid #ddd", borderRadius: "8px" }}>
      <h2>Profili Im</h2>

      <div style={{ marginBottom: "16px" }}>
        <label style={{ display: "block", marginBottom: "4px" }}>Emri</label>
        <input
          value={name}
          onChange={e => setName(e.target.value)}
          style={{ width: "100%", padding: "8px", borderRadius: "4px", border: "1px solid #ccc" }}
        />
      </div>

      <div style={{ marginBottom: "16px" }}>
        <label style={{ display: "block", marginBottom: "4px" }}>Email</label>
        <input
          value={mockUser.email}
          disabled
          style={{ width: "100%", padding: "8px", borderRadius: "4px", border: "1px solid #ccc", background: "#f5f5f5" }}
        />
      </div>

      <div style={{ marginBottom: "24px" }}>
        <label style={{ display: "block", marginBottom: "4px" }}>Roli</label>
        <select
          value={role}
          onChange={e => setRole(e.target.value)}
          style={{ width: "100%", padding: "8px", borderRadius: "4px", border: "1px solid #ccc" }}
        >
          <option value="attendee">Attendee</option>
          <option value="organizer">Organizer</option>
          <option value="admin">Admin</option>
        </select>
      </div>

      <button
        onClick={handleSave}
        style={{ padding: "10px 20px", background: "#4F46E5", color: "white", border: "none", borderRadius: "4px", cursor: "pointer" }}
      >
        Ruaj Ndryshimet
      </button>
      {saved && <p style={{ color: "green", marginTop: "12px" }}>✅ U ruajt!</p>}

      <div style={{ marginTop: "32px", borderTop: "1px solid #ddd", paddingTop: "24px" }}>
        <h3>Ndrysho Fjalëkalimin</h3>

        <div style={{ marginBottom: "12px" }}>
          <label style={{ display: "block", marginBottom: "4px" }}>Fjalëkalimi Aktual</label>
          <input
            type="password"
            value={currentPassword}
            onChange={e => setCurrentPassword(e.target.value)}
            style={{ width: "100%", padding: "8px", borderRadius: "4px", border: "1px solid #ccc" }}
          />
        </div>

        <div style={{ marginBottom: "12px" }}>
          <label style={{ display: "block", marginBottom: "4px" }}>Fjalëkalimi i Ri</label>
          <input
            type="password"
            value={newPassword}
            onChange={e => setNewPassword(e.target.value)}
            style={{ width: "100%", padding: "8px", borderRadius: "4px", border: "1px solid #ccc" }}
          />
        </div>

        <div style={{ marginBottom: "16px" }}>
          <label style={{ display: "block", marginBottom: "4px" }}>Konfirmo Fjalëkalimin</label>
          <input
            type="password"
            value={confirmPassword}
            onChange={e => setConfirmPassword(e.target.value)}
            style={{ width: "100%", padding: "8px", borderRadius: "4px", border: "1px solid #ccc" }}
          />
        </div>

        <button
          onClick={handleChangePassword}
          style={{ padding: "10px 20px", background: "#059669", color: "white", border: "none", borderRadius: "4px", cursor: "pointer" }}
        >
          Ndrysho Fjalëkalimin
        </button>

        {passwordMsg && (
          <p style={{ marginTop: "12px", color: passwordMsg.includes("❌") ? "red" : "green" }}>
            {passwordMsg}
          </p>
        )}
      </div>
    </div>
  )
}