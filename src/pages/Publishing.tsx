import { useState } from 'react'
import { LiquidCard, PageHeader, StatusBadge, PlatformIcon } from '../components/ui'
import { posts, platformMeta } from '../data/dummy'

const filters = ['all', 'published', 'scheduled', 'draft', 'failed']

export default function Publishing() {
  const [filter, setFilter] = useState('all')
  const rows = filter === 'all' ? posts : posts.filter((p) => p.status === filter)

  return (
    <>
      <PageHeader title="Publishing" subtitle="Cross-platform queue · powered by n8n + Buffer/Publer"
        action={<button className="btn-primary">Schedule post</button>} />

      <div style={{ display: 'flex', gap: 8, marginBottom: 16 }}>
        {filters.map((f) => (
          <button key={f} onClick={() => setFilter(f)} className={filter === f ? 'btn-primary' : 'btn-secondary'}
            style={{ textTransform: 'capitalize', color: filter === f ? '#fff' : 'var(--label-secondary)', padding: '7px 14px' }}>{f}</button>
        ))}
      </div>

      <LiquidCard lg>
        {rows.map((p) => (
          <div key={p.id} className="sep-b" style={{ display: 'flex', alignItems: 'center', gap: 14, padding: '13px 4px' }}>
            <PlatformIcon platform={p.platform} size={38} />
            <div style={{ minWidth: 0 }}>
              <div style={{ fontSize: 15, fontWeight: 500 }}>{p.title}</div>
              <div style={{ fontSize: 12.5, color: 'var(--label-secondary)' }}>
                {platformMeta[p.platform].label}{p.via ? ` · via ${p.via}` : ''} · {p.when}
              </div>
            </div>
            <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: 12 }}>
              <StatusBadge status={p.status} />
              <span style={{ fontSize: 13, color: 'var(--blue)', cursor: 'default' }}>View</span>
            </div>
          </div>
        ))}
        {rows.length === 0 && <div style={{ padding: 24, textAlign: 'center', color: 'var(--label-tertiary)' }}>No posts</div>}
      </LiquidCard>
    </>
  )
}
