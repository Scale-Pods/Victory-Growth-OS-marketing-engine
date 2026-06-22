import { Sparkles } from 'lucide-react'
import { LiquidCard, PageHeader } from '../components/ui'
import { calendar, platformMeta } from '../data/dummy'

const hours = ['09:00', '12:00', '15:00', '18:00']

export default function CalendarPage() {
  return (
    <>
      <PageHeader title="Content Calendar" subtitle="Week of Jun 22 · drag to reschedule"
        action={<button className="btn-primary"><Sparkles size={15} style={{ verticalAlign: -2, marginRight: 6 }} />Generate from trends</button>} />
      <LiquidCard lg>
        <div style={{ display: 'grid', gridTemplateColumns: '60px repeat(7,1fr)', gap: 8 }}>
          <div />
          {calendar.map((d) => (
            <div key={d.day} style={{ fontSize: 12, fontWeight: 600, letterSpacing: '.03em', textTransform: 'uppercase', color: 'var(--label-tertiary)', textAlign: 'center', paddingBottom: 6 }}>{d.day}</div>
          ))}
          {hours.map((h, hi) => (
            <Row key={h} hour={h} hi={hi} />
          ))}
        </div>
      </LiquidCard>
    </>
  )
}

function Row({ hour, hi }: { hour: string; hi: number }) {
  return (
    <>
      <div style={{ fontSize: 11, color: 'var(--label-tertiary)', textAlign: 'right', paddingTop: 6 }}>{hour}</div>
      {calendar.map((d, di) => {
        const it = d.items[(hi + di) % 3 === 0 ? 0 : -1] // sprinkle items deterministically
        const show = d.items.length > 0 && (di + hi) % 2 === 0 && d.items[0]
        return (
          <div key={d.day + hour} style={{ minHeight: 64, borderRadius: 12, background: 'var(--fill-quaternary)', padding: 6 }}>
            {show && (
              <div style={{ borderRadius: 9, padding: '6px 8px', fontSize: 11.5, fontWeight: 500, lineHeight: 1.25, color: '#fff', background: platformMeta[show.platform].color }}>
                <small style={{ display: 'block', fontSize: 10, opacity: .85, fontWeight: 600, textTransform: 'uppercase' }}>{platformMeta[show.platform].label}</small>
                {show.title}
              </div>
            )}
          </div>
        )
      })}
    </>
  )
}
