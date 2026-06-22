import { ReactNode } from 'react'
import { ArrowUpRight } from 'lucide-react'
import { platformMeta } from '../data/dummy'

export function LiquidCard({ children, lg, hover, className = '', style }: { children: ReactNode; lg?: boolean; hover?: boolean; className?: string; style?: React.CSSProperties }) {
  return (
    <div className={`liquid-card ${lg ? 'card-lg' : ''} ${hover ? 'hoverable' : ''} ${className}`} style={style}>
      {children}
    </div>
  )
}

export function MetricTile({ label, value, trend, dir, accent }: { label: string; value: string; trend: string; dir: string; accent: string }) {
  return (
    <LiquidCard lg className="metric-tile" style={{ ['--tile-accent' as any]: accent }}>
      <span className="m-label">{label}</span>
      <span className="m-value">{value}</span>
      <span className={`m-trend ${dir}`} style={dir === 'flat' ? { color: 'var(--label-secondary)' } : undefined}>
        {dir === 'up' && <ArrowUpRight size={13} strokeWidth={2.5} />}
        {trend}
      </span>
    </LiquidCard>
  )
}

const statusClass: Record<string, string> = {
  published: 'badge-green', scheduled: 'badge-orange', draft: 'badge-grey', failed: 'badge-red',
}
export function StatusBadge({ status }: { status: string }) {
  return <span className={`badge ${statusClass[status] || 'badge-grey'}`}>{status[0].toUpperCase() + status.slice(1)}</span>
}

export function PlatformIcon({ platform, size = 34 }: { platform: keyof typeof platformMeta; size?: number }) {
  const m = platformMeta[platform]
  return (
    <div style={{ width: size, height: size, borderRadius: 9, background: m.color, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontWeight: 700, fontSize: size * 0.36, flex: 'none' }}>
      {m.abbr}
    </div>
  )
}

export function PageHeader({ title, subtitle, action }: { title: string; subtitle?: string; action?: ReactNode }) {
  return (
    <div style={{ display: 'flex', alignItems: 'flex-end', gap: 16, marginBottom: 24 }}>
      <div>
        <h1 style={{ fontFamily: 'var(--font-display)', fontSize: 28, fontWeight: 700, lineHeight: 1.21 }}>{title}</h1>
        {subtitle && <div style={{ fontSize: 13, color: 'var(--label-secondary)', marginTop: 2 }}>{subtitle}</div>}
      </div>
      <div style={{ flex: 1 }} />
      {action}
    </div>
  )
}
