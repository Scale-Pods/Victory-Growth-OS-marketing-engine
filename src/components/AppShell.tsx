import { useEffect, useState } from 'react'
import { NavLink, Outlet } from 'react-router-dom'
import {
  LayoutGrid, Users, TrendingUp, Calendar, Send, BarChart3, Settings as Cog,
  Search, Sun, Moon, LogOut, Brain,
} from 'lucide-react'
import { useAuth } from '../lib/auth'

const roleBadge: Record<string, string> = { admin: 'badge-purple', client: 'badge-blue', designer: 'badge-orange' }

const nav = [
  { section: 'Marketing engine', items: [
    { to: '/', label: 'Dashboard', icon: LayoutGrid, end: true },
    { to: '/clients', label: 'Clients', icon: Users, count: '3' },
    { to: '/trends', label: 'Trend Intelligence', icon: TrendingUp },
    { to: '/calendar', label: 'Content Calendar', icon: Calendar, count: '12' },
    { to: '/publishing', label: 'Publishing', icon: Send },
  ]},
  { section: 'Insight', items: [
    { to: '/analytics', label: 'Analytics', icon: BarChart3 },
    { to: '/intelligence', label: 'Business Intelligence', icon: Brain },
    { to: '/settings', label: 'Settings', icon: Cog },
  ]},
]

export default function AppShell() {
  const [theme, setTheme] = useState<string>(() => document.documentElement.getAttribute('data-theme') || 'dark')
  useEffect(() => { document.documentElement.setAttribute('data-theme', theme) }, [theme])
  const { user, role, signOut } = useAuth()
  const initials = (user?.email || 'U').slice(0, 2).toUpperCase()

  return (
    <div style={{ display: 'flex', minHeight: '100vh' }}>
      <aside className="sidebar">
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '6px 8px 4px' }}>
          <img src="https://victoryenergy.us/wp-content/uploads/2026/05/VE-Logo-Color.svg" alt="Victory Energy" style={{ height: 32 }}
            onError={(e) => { (e.currentTarget as HTMLImageElement).replaceWith(Object.assign(document.createElement('span'), { textContent: 'Victory Energy', style: 'font-weight:700;letter-spacing:-.02em' })) }} />
        </div>
        <div style={{ padding: '0 8px 2px', color: 'var(--label-tertiary)', fontSize: 11, fontWeight: 600, letterSpacing: '.04em', textTransform: 'uppercase' }}>Growth OS</div>

        {nav.map((g) => (
          <div key={g.section}>
            <div className="nav-section-label">{g.section}</div>
            {g.items.map((it) => {
              const Icon = it.icon
              return (
                <NavLink key={it.to} to={it.to} end={(it as any).end} className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}>
                  <Icon size={18} strokeWidth={1.8} />
                  {it.label}
                  {(it as any).count && <span className="count">{(it as any).count}</span>}
                </NavLink>
              )
            })}
          </div>
        ))}
      </aside>

      <div style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column' }}>
        <header style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '18px 28px 0' }}>
          <div style={{ flex: 1 }} />
          <div className="input" style={{ display: 'flex', alignItems: 'center', gap: 8, width: 220, color: 'var(--label-tertiary)', padding: '8px 12px' }}>
            <Search size={16} strokeWidth={1.8} /> Search
          </div>
          <button className="btn-secondary" style={{ width: 38, height: 38, padding: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--label-primary)' }}
            onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')} aria-label="Toggle theme">
            {theme === 'dark' ? <Sun size={18} /> : <Moon size={18} />}
          </button>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <div style={{ textAlign: 'right', lineHeight: 1.2 }}>
              <div style={{ fontSize: 13, fontWeight: 500 }}>{user?.email}</div>
              {role && <span className={`badge ${roleBadge[role] || 'badge-grey'}`} style={{ fontSize: 10, padding: '1px 7px' }}>{role}</span>}
            </div>
            <div style={{ width: 38, height: 38, borderRadius: '50%', background: 'linear-gradient(135deg,var(--indigo),var(--blue))', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontWeight: 600, fontSize: 14 }}>{initials}</div>
          </div>
          <button className="btn-secondary" style={{ width: 38, height: 38, padding: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--label-primary)' }}
            onClick={() => signOut()} aria-label="Sign out" title="Sign out">
            <LogOut size={17} />
          </button>
        </header>
        <main style={{ padding: '22px 28px 48px', flex: 1 }}>
          <Outlet />
        </main>
      </div>
    </div>
  )
}
