import { Routes, Route, Navigate } from 'react-router-dom'
import AppShell from './components/AppShell'
import Dashboard from './pages/Dashboard'
import Clients from './pages/Clients'
import BusinessProfile from './pages/BusinessProfile'
import Trends from './pages/Trends'
import CalendarPage from './pages/Calendar'
import Publishing from './pages/Publishing'
import Analytics from './pages/Analytics'
import Settings from './pages/Settings'

export default function App() {
  return (
    <Routes>
      <Route element={<AppShell />}>
        <Route path="/" element={<Dashboard />} />
        <Route path="/clients" element={<Clients />} />
        <Route path="/clients/:id" element={<BusinessProfile />} />
        <Route path="/trends" element={<Trends />} />
        <Route path="/calendar" element={<CalendarPage />} />
        <Route path="/publishing" element={<Publishing />} />
        <Route path="/analytics" element={<Analytics />} />
        <Route path="/settings" element={<Settings />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Route>
    </Routes>
  )
}
