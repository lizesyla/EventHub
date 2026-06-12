import { BrowserRouter, Routes, Route, Link } from 'react-router-dom'
import './App.css'
import Profile from './pages/Profile'
import CreateEvent from './pages/CreateEvent'

function App() {
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
          <h1 style={{ margin: 0, fontSize: '22px', fontWeight: '800', color: '#ffffff', letterSpacing: '0.5px' }}>
            Event<span style={{ color: '#8b5cf6' }}>Hub</span>
          </h1>
          <div style={{ display: 'flex', gap: '24px' }}>
            <Link to="/" style={{ color: '#ffffff', textDecoration: 'none', fontWeight: '600', fontSize: '15px' }}>Kryesore</Link>
            <Link to="/profile" style={{ color: '#ffffff', textDecoration: 'none', fontWeight: '600', fontSize: '15px' }}>Profili Im</Link>
            <Link to="/create-event" style={{ color: '#8b5cf6', textDecoration: 'none', fontWeight: '600', fontSize: '15px' }}>Krijo Event</Link>
          </div>
        </header>

        <main>
          <Routes>
            <Route path="/" element={
              <div style={{ padding: '60px 20px', textAlign: 'center', color: '#fff' }}>
                <h2 style={{ fontSize: '36px', marginBottom: '10px' }}>Welcome to EventHub</h2>
                <p style={{ color: '#b3b0cd', fontSize: '18px' }}>Internal Events & RSVP Platform</p>
              </div>
            } />
            <Route path="/profile" element={<Profile />} />
            <Route path="/create-event" element={<CreateEvent />} />
          </Routes>
        </main>
      </div>
    </BrowserRouter>
  )
}

export default App