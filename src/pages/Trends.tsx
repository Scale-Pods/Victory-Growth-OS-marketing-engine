import { TrendingUp, Sparkles } from 'lucide-react'
import { LiquidCard, PageHeader } from '../components/ui'
import { trends, platformMeta } from '../data/dummy'

export default function Trends() {
  return (
    <>
      <PageHeader title="Trend Intelligence" subtitle="Live topics per selected platform · feeds the calendar"
        action={<button className="btn-primary"><Sparkles size={15} style={{ verticalAlign: -2, marginRight: 6 }} />Refresh trends</button>} />
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(300px,1fr))', gap: 16 }}>
        {trends.map((t) => (
          <LiquidCard key={t.topic} hover>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
              <span className="badge" style={{ background: platformMeta[t.platform as keyof typeof platformMeta].color, color: '#fff' }}>{platformMeta[t.platform as keyof typeof platformMeta].label}</span>
              <span className="badge badge-grey">{t.tag}</span>
              <span className="badge badge-green" style={{ marginLeft: 'auto' }}><TrendingUp size={12} /> {t.delta}</span>
            </div>
            <div style={{ fontSize: 16.5, fontWeight: 600, lineHeight: 1.3, marginBottom: 14 }}>{t.topic}</div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <div style={{ flex: 1, height: 6, borderRadius: 3, background: 'var(--fill-tertiary)', overflow: 'hidden' }}>
                <div style={{ width: `${t.score}%`, height: '100%', background: 'var(--blue)', borderRadius: 3 }} />
              </div>
              <span style={{ fontSize: 13, fontWeight: 300, fontVariantNumeric: 'tabular-nums', letterSpacing: '-.02em' }}>{t.score}</span>
            </div>
            <button className="btn-secondary" style={{ marginTop: 14, width: '100%', color: 'var(--label-primary)' }}>Add to calendar</button>
          </LiquidCard>
        ))}
      </div>
    </>
  )
}
