import { LiquidCard, PageHeader, PlatformIcon } from '../components/ui'
import { platforms } from '../data/dummy'

export default function Settings() {
  return (
    <>
      <PageHeader title="Settings" subtitle="Integrations & connected accounts" />
      <LiquidCard lg style={{ marginBottom: 16 }}>
        <h2 style={{ fontSize: 18, fontWeight: 600, marginBottom: 6 }}>Integrations</h2>
        <div style={{ fontSize: 13, color: 'var(--label-secondary)', marginBottom: 14 }}>Connect the platforms your content publishes to.</div>
        {platforms.map((p) => (
          <div key={p.key} className="sep-b" style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '13px 2px' }}>
            <PlatformIcon platform={p.key as any} size={38} />
            <div>
              <div style={{ fontSize: 15, fontWeight: 500 }}>{p.name}</div>
              <div style={{ fontSize: 12.5, color: 'var(--label-secondary)' }}>{p.handle}</div>
            </div>
            <div style={{ marginLeft: 'auto' }}>
              {p.live
                ? <button className="btn-secondary" style={{ color: 'var(--label-primary)' }}>Manage</button>
                : <button className="btn-primary">Connect</button>}
            </div>
          </div>
        ))}
      </LiquidCard>

      <LiquidCard lg>
        <h2 style={{ fontSize: 18, fontWeight: 600, marginBottom: 14 }}>Workspace</h2>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(240px,1fr))', gap: 14 }}>
          <div><div style={{ fontSize: 12, textTransform: 'uppercase', letterSpacing: '.02em', color: 'var(--label-tertiary)', marginBottom: 6 }}>Workspace name</div><input className="input" defaultValue="ScalePods × Victory Energy" /></div>
          <div><div style={{ fontSize: 12, textTransform: 'uppercase', letterSpacing: '.02em', color: 'var(--label-tertiary)', marginBottom: 6 }}>Timezone</div><input className="input" defaultValue="America/Chicago (CST)" /></div>
        </div>
      </LiquidCard>
    </>
  )
}
