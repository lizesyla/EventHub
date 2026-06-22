import { BrowserRouter, Routes, Route, Link } from 'react-router-dom'
import { useState } from 'react'
import './App.css'
import Profile from './pages/Profile'
import CreateEvent from './pages/CreateEvent'
import Login from './pages/Login'
import Register from './pages/Register'
import Home from './pages/Home'
import Admin from './pages/Admin'
import Events from './pages/Events'
import MyEvents from './pages/MyEvents'

function parseRole() {
  try {
    const token = localStorage.getItem("token")
    if (!token) return null
    const payload = JSON.parse(atob(token.split(".")[1]))
    return payload.role || null
  } catch {
    return null
  }
}

function ProtectedRoute({ children }) {
  const token = localStorage.getItem("token")
  if (!token) {
    window.location.href = "/login"
    return null
  }
  return children
}

function App() {
  const [token, setToken] = useState(localStorage.getItem("token"))
  const [role, setRole] = useState(parseRole())

  function handleLogout() {
    localStorage.removeItem("token")
    localStorage.removeItem("refresh_token")
    localStorage.removeItem("user")
    setToken(null)
    setRole(null)
    window.location.href = "/"
  }

  function handleLogin(newToken) {
    localStorage.setItem("token", newToken)
    setToken(newToken)
    try {
      const payload = JSON.parse(atob(newToken.split(".")[1]))
      setRole(payload.role || null)
    } catch {
      setRole(null)
    }
  }

  const linkStyle = { color: "#ffffff", textDecoration: "none", fontWeight: "600", fontSize: "15px" }
  const activeLinkStyle = { color: "#8b5cf6", textDecoration: "none", fontWeight: "600", fontSize: "15px" }
  const isAdmin = token && role === "admin"

  return (
    <BrowserRouter>
      <div style={{ backgroundColor: "#0f0c1b", minHeight: "100vh", fontFamily: "'Inter', sans-serif" }}>
        {/* Header is hidden for admins because Admin has its own sidebar. */}
        {!isAdmin && (
          <header style={{
            backgroundColor: "#1a162e",
            borderBottom: "1px solid #2d294e",
            padding: "15px 40px",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
          }}>
            <Link to="/" style={{ textDecoration: "none" }}>
              <h1 style={{ margin: 0, fontSize: "22px", fontWeight: "800", color: "#ffffff" }}>
                Event<span style={{ color: "#8b5cf6" }}>Hub</span>
              </h1>
            </Link>

            <div style={{ display: "flex", gap: "24px", alignItems: "center" }}>
              <Link to="/" style={linkStyle}>Home</Link>

              {!token && <Link to="/events" style={linkStyle}>Events</Link>}

              {token && (
                <>
                  <Link to="/events" style={linkStyle}>Events</Link>
                  <Link to="/create-event" style={activeLinkStyle}>Create Event</Link>
                  <Link to="/my-events" style={linkStyle}>My Events</Link>
                  <Link to="/profile" style={linkStyle}>My Profile</Link>
                </>
              )}

              {token ? (
                <button onClick={handleLogout} style={{ padding: "7px 16px", backgroundColor: "transparent", color: "#ef4444", border: "1px solid #ef4444", borderRadius: "6px", cursor: "pointer", fontSize: "14px", fontWeight: "600" }}>
                  Sign Out
                </button>
              ) : (
                <Link to="/login" style={{ padding: "7px 16px", backgroundColor: "#8b5cf6", color: "#fff", borderRadius: "6px", textDecoration: "none", fontSize: "14px", fontWeight: "600" }}>
                  Sign In
                </Link>
              )}
            </div>
          </header>
        )}

        <main>
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/events" element={<Events />} />
            <Route path="/login" element={<Login onLogin={handleLogin} />} />
            <Route path="/register" element={<Register />} />
            <Route path="/profile" element={
              <ProtectedRoute><Profile /></ProtectedRoute>
            } />
            <Route path="/create-event" element={
              <ProtectedRoute><CreateEvent /></ProtectedRoute>
            } />
            <Route path="/my-events" element={
              <ProtectedRoute><MyEvents /></ProtectedRoute>
            } />
            <Route path="/admin" element={
              <ProtectedRoute><Admin defaultTab="events" /></ProtectedRoute>
            } />
            <Route path="/admin/users" element={
              <ProtectedRoute><Admin defaultTab="users" /></ProtectedRoute>
            } />
          </Routes>
        </main>
      </div>
    </BrowserRouter>
  )
}

export default App
