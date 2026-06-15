import { BrowserRouter, Routes, Route, Link } from 'react-router-dom'
import { useState } from 'react'
import './App.css'
import Profile from './pages/Profile'
import CreateEvent from './pages/CreateEvent'
import Login from './pages/Login'
import Register from './pages/Register'
import Home from './pages/Home'

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

  function handleLogout() {
    localStorage.removeItem("token")
    setToken(null)
    window.location.href = "/"
  }

  function handleLogin(newToken) {
    localStorage.setItem("token", newToken)
    setToken(newToken)
  }

  return (
    <BrowserRouter>
      <div style={{ backgroundColor: '#0f0c1b', minHeight: '100vh', fontFamily: "'Inter', sans-serif" }}>
        
        <header style={{ 
          backgroundColor: '#1a162e', 
          borderBottom: '1px solid #2d294e', 
          padding: '15px 40px',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center'
        }}>
          <h1 style={{ margin: 0, fontSize: '22px', fontWeight: '800', color: '#ffffff' }}>
            Event<span style={{ color: '#8b5cf6' }}>Hub</span>
          </h1>
          <div style={{ display: 'flex', gap: '24px', alignItems: 'center' }}>
            <Link to="/" style={{ color: '#ffffff', textDecoration: 'none', fontWeight: '600', fontSize: '15px' }}>Home</Link>
            {token && (
              <Link to="/profile" style={{ color: '#ffffff', textDecoration: 'none', fontWeight: '600', fontSize: '15px' }}>My Profile</Link>
            )}
            {token ? (
              <button onClick={handleLogout} style={{ padding: '7px 16px', backgroundColor: 'transparent', color: '#ef4444', border: '1px solid #ef4444', borderRadius: '6px', cursor: 'pointer', fontSize: '14px', fontWeight: '600' }}>
                Sign Out
              </button>
            ) : (
              <Link to="/login" style={{ padding: '7px 16px', backgroundColor: '#8b5cf6', color: '#fff', borderRadius: '6px', textDecoration: 'none', fontSize: '14px', fontWeight: '600' }}>
                Sign In
              </Link>
            )}
          </div>
        </header>

        <main>
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/login" element={<Login onLogin={handleLogin} />} />
            <Route path="/register" element={<Register />} />
            <Route path="/profile" element={
              <ProtectedRoute>
                <Profile />
              </ProtectedRoute>
            } />
            <Route path="/create-event" element={
              <ProtectedRoute>
                <CreateEvent />
              </ProtectedRoute>
            } />
          </Routes>
        </main>
      </div>
    </BrowserRouter>
  )
}

export default App