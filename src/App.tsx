import { Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider, useAuth } from './lib/auth'
import AppShell from './components/AppShell'
import Login from './pages/Login'
import ResetPassword from './pages/ResetPassword'
import Dashboard from './pages/Dashboard'
import Clients from './pages/Clients'
import BusinessProfile from './pages/BusinessProfile'
import Trends from './pages/Trends'
import CalendarPage from './pages/Calendar'
import Publishing from './pages/Publishing'
import Analytics from './pages/Analytics'
import Settings from './pages/Settings'
import Intelligence from './pages/Intelligence'
import IntelligenceReport from './pages/IntelligenceReport'
import Strategy from './pages/Strategy'

function Protected() {
  const { session, loading } = useAuth()
  if (loading) return <div style={{ minHeight: '100vh' }} />
  return session ? <AppShell /> : <Navigate to="/login" replace />
}

export default function App() {
  return (
    <AuthProvider>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/reset-password" element={<ResetPassword />} />
        <Route element={<Protected />}>
          <Route path="/" element={<Dashboard />} />
          <Route path="/clients" element={<Clients />} />
          <Route path="/clients/:id" element={<BusinessProfile />} />
          <Route path="/trends" element={<Trends />} />
          <Route path="/strategy" element={<Strategy />} />
          <Route path="/calendar" element={<CalendarPage />} />
          <Route path="/publishing" element={<Publishing />} />
          <Route path="/analytics" element={<Analytics />} />
          <Route path="/intelligence" element={<Intelligence />} />
          <Route path="/intelligence/:id" element={<IntelligenceReport />} />
          <Route path="/settings" element={<Settings />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Route>
      </Routes>
    </AuthProvider>
  )
}
