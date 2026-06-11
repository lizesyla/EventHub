import { BrowserRouter, Routes, Route, Link } from 'react-router-dom'
import './App.css'
import Profile from './pages/Profile'

function App() {
  return (
    <BrowserRouter>
      <div>
        <nav>
          <h1>EventHub</h1>
          <Link to="/profile">Profili Im</Link>
        </nav>

        <main>
          <Routes>
            <Route path="/" element={
              <div>
                <h2>Welcome to EventHub</h2>
                <p>Internal Events & RSVP Platform</p>
              </div>
            } />
            <Route path="/profile" element={<Profile />} />
          </Routes>
        </main>
      </div>
    </BrowserRouter>
  )
}

export default App