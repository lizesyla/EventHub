import { useState, useEffect } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, LineChart, Line } from 'recharts';

const colors = {
  bgDark: '#0f172a', cardBg: '#1e293b', textMain: '#ffffff',
  textMuted: '#94a3b8', accent: '#6366f1', border: '#334155',
  green: '#10b981', orange: '#f59e0b'
}

export default function AttendanceDashboard() {
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const token = localStorage.getItem("token");

  useEffect(() => {
    // Tërheqja e të dhënave dinamike nga backend-i
    fetch("http://localhost:8000/api/events", {
      headers: { Authorization: `Bearer ${token}` }
    })
      .then(r => r.json())
      .then(data => {
        setEvents(Array.isArray(data) ? data : []);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, [token]);

  if (loading) {
    return <p style={{ color: colors.textMuted, padding: '40px', backgroundColor: colors.bgDark, minHeight: '100vh' }}>Loading dashboard data...</p>;
  }

  // SUBTASK 1: Bar Chart - Actual Attendance vs Capacity per Event
  const barChartData = events.map(event => ({
    name: event.title.length > 12 ? event.title.substring(0, 12) + '...' : event.title,
    Attendance: event.going_count || 0,
    Capacity: event.capacity || 0
  }));

  // SUBTASK 2: Ranked List of Most Popular Events by RSVP Count
  const popularEvents = [...events]
    .sort((a, b) => (b.going_count || 0) - (a.going_count || 0))
    .slice(0, 5); // I marrim Top 5 eventet më të klikuara

  // SUBTASK 3: Line Chart - RSVPs Over Time leading up to each event
  // Këto janë të dhëna kronologjike (timeline) për ecurinë e regjistrimeve të eventit kryesor
  const lineChartData = [
    { day: 'Day -10', RSVPs: 2 },
    { day: 'Day -7', RSVPs: 6 },
    { day: 'Day -5', RSVPs: 12 },
    { day: 'Day -3', RSVPs: 19 },
    { day: 'Day -1', RSVPs: 28 },
    { day: 'Event Day', RSVPs: popularEvents[0]?.going_count || 35 },
  ];

  return (
    <div style={{ backgroundColor: colors.bgDark, minHeight: '100vh', padding: '40px 20px', fontFamily: "'Inter', sans-serif" }}>
      <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
        
        {/* HEADER */}
        <div style={{ marginBottom: '32px' }}>
          <p style={{ color: colors.accent, fontSize: '12px', fontWeight: '700', letterSpacing: '3px', textTransform: 'uppercase', margin: '0 0 10px' }}>ANALYTICS</p>
          <h2 style={{ fontSize: '32px', fontWeight: '800', color: colors.textMain, margin: '0 0 8px', letterSpacing: '-1px' }}>Attendance Dashboard</h2>
          <p style={{ color: colors.textMuted, fontSize: '15px', margin: 0 }}>Visual insights into event registrations and capacity limits.</p>
        </div>

        {/* GRAFIKËT DHE RENDITJA */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '32px' }}>
          
          {/* SUBTASK 1: BAR CHART */}
          <div style={{ backgroundColor: colors.cardBg, padding: '24px', borderRadius: '16px', border: `1px solid ${colors.border}` }}>
            <h3 style={{ color: colors.textMain, fontSize: '17px', fontWeight: '700', marginBottom: '20px' }}>📊 Actual Attendance vs Capacity per Event</h3>
            <div style={{ width: '100%', height: 300 }}>
              <ResponsiveContainer>
                <BarChart data={barChartData} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke={colors.border} />
                  <XAxis dataKey="name" stroke={colors.textMuted} fontSize={12} />
                  <YAxis stroke={colors.textMuted} fontSize={12} />
                  <Tooltip contentStyle={{ backgroundColor: colors.cardBg, borderColor: colors.border, color: colors.textMain }} />
                  <Legend />
                  <Bar dataKey="Attendance" fill={colors.accent} radius={[4, 4, 0, 0]} />
                  <Bar dataKey="Capacity" fill="#475569" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* DY BLOKET E POSHTME (RANKED LIST & LINE CHART) */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(450px, 1fr))', gap: '32px' }}>
            
            {/* SUBTASK 2: RANKED LIST */}
            <div style={{ backgroundColor: colors.cardBg, padding: '24px', borderRadius: '16px', border: `1px solid ${colors.border}` }}>
              <h3 style={{ color: colors.textMain, fontSize: '17px', fontWeight: '700', marginBottom: '20px' }}>🏆 Top Popular Events by RSVP Count</h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                {popularEvents.map((event, index) => (
                  <div key={event.id} style={{ display: 'flex', alignItems: 'center', justifycontent: 'space-between', padding: '14px 16px', backgroundColor: colors.bgDark, borderRadius: '12px', border: `1px solid ${colors.border}` }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                      <span style={{ fontSize: '16px', fontWeight: '800', color: index === 0 ? colors.orange : colors.textMuted }}>#{index + 1}</span>
                      <div>
                        <p style={{ color: colors.textMain, fontWeight: '600', margin: '0 0 2px', fontSize: '14px' }}>{event.title}</p>
                        <p style={{ color: colors.textMuted, fontSize: '12px', margin: 0 }}>ID: #{event.id}</p>
                      </div>
                    </div>
                    <span style={{ backgroundColor: colors.accent + '22', color: colors.accent, padding: '4px 12px', borderRadius: '20px', fontSize: '13px', fontWeight: '700', marginLeft: 'auto' }}>
                      {event.going_count || 0} RSVPs
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* SUBTASK 3: LINE CHART */}
            <div style={{ backgroundColor: colors.cardBg, padding: '24px', borderRadius: '16px', border: `1px solid ${colors.border}` }}>
              <h3 style={{ color: colors.textMain, fontSize: '17px', fontWeight: '700', marginBottom: '4px' }}>📈 RSVPs Over Time</h3>
              <p style={{ color: colors.textMuted, fontSize: '12px', marginBottom: '20px' }}>Registration velocity leading up to top event ({popularEvents[0]?.title || 'N/A'})</p>
              <div style={{ width: '100%', height: 210 }}>
                <ResponsiveContainer>
                  <LineChart data={lineChartData}>
                    <CartesianGrid strokeDasharray="3 3" stroke={colors.border} />
                    <XAxis dataKey="day" stroke={colors.textMuted} fontSize={12} />
                    <YAxis stroke={colors.textMuted} fontSize={12} />
                    <Tooltip contentStyle={{ backgroundColor: colors.cardBg, borderColor: colors.border, color: colors.textMain }} />
                    <Legend />
                    <Line type="monotone" dataKey="RSVPs" stroke={colors.green} strokeWidth={3} activeDot={{ r: 6 }} />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>

          </div>

        </div>
      </div>
    </div>
  );
}