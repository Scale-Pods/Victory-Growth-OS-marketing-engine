import { motion } from 'framer-motion'
import { LiquidCard, MetricTile, StatusBadge, PlatformIcon } from '../components/ui'
import { kpis, calendar, posts, platforms, platformMeta } from '../data/dummy'

const stagger = { visible: { transition: { staggerChildren: 0.05, delayChildren: 0.04 } } }
const item = { hidden: { opacity: 0, y: 10, scale: 0.98 }, visible: { opacity: 1, y: 0, scale: 1, transition: { duration: 0.28, ease: [0, 0, 0.2, 1] as any } } }

export default function Dashboard() {
  return (
    <>
      <div style={{ display: 'flex', alignItems: 'flex-end', marginBottom: 24 }}>
        <div>
          <h1 style={{ fontFamily: 'var(--font-display)', fontSize: 28, fontWeight: 700, lineHeight: 1.21 }}>Marketing Engine</h1>
          <div style={{ fontSize: 13, color: 'var(--label-secondary)', marginTop: 2 }}>Victory Energy · solar campaigns · 5 platforms connected</div>
        </div>
        <div style={{ flex: 1 }} />
        <button className="btn-primary">New campaign</button>
      </div>

      <motion.div variants={stagger} initial="hidden" animate="visible" style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 16, marginBottom: 16 }}>
        {kpis.map((k) => (
          <motion.div key={k.label} variants={item}>
            <MetricTile {...(k as any)} />
          </motion.div>
        ))}
      </motion.div>

      <div style={{ display: 'grid', gridTemplateColumns: '1.6fr 1fr', gap: 16 }}>
        <LiquidCard lg>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
            <h2 style={{ fontSize: 20, fontWeight: 600 }}>Content Calendar</h2>
            <span style={{ fontSize: 13, color: 'var(--blue)' }}>This week ›</span>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7,1fr)', gap: 8 }}>
            {calendar.map((d) => (
              <div key={d.day} style={{ display: 'flex', flexDirection: 'column', gap: 6, minHeight: 124 }}>
                <div style={{ fontSize: 11, fontWeight: 600, letterSpacing: '.03em', textTransform: 'uppercase', color: 'var(--label-tertiary)', textAlign: 'center' }}>{d.day}</div>
                {d.items.map((c, i) => (
                  <div key={i} style={{ borderRadius: 10, padding: '7px 9px', fontSize: 11.5, fontWeight: 500, lineHeight: 1.25, color: '#fff', background: platformMeta[c.platform].color }}>
                    <small style={{ display: 'block', fontSize: 10, opacity: .85, fontWeight: 600, letterSpacing: '.02em', textTransform: 'uppercase', marginBottom: 1 }}>{platformMeta[c.platform].label}</small>
                    {c.title}
                  </div>
                ))}
              </div>
            ))}
          </div>
          <div style={{ display: 'flex', gap: 10, marginTop: 18, alignItems: 'center' }}>
            <button className="btn-primary">Generate from trends</button>
            <span className="badge badge-grey">AI fills gaps from Trend Engine</span>
          </div>
        </LiquidCard>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <LiquidCard lg>
            <h2 style={{ fontSize: 17, fontWeight: 600, marginBottom: 12 }}>Recent Activity</h2>
            {posts.slice(0, 4).map((p) => (
              <div key={p.id} className="sep-b" style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '11px 2px' }}>
                <PlatformIcon platform={p.platform} />
                <div>
                  <div style={{ fontSize: 14, fontWeight: 500 }}>{p.title}</div>
                  <div style={{ fontSize: 12, color: 'var(--label-secondary)' }}>{platformMeta[p.platform].label} · {p.when}</div>
                </div>
                <div style={{ marginLeft: 'auto' }}><StatusBadge status={p.status} /></div>
              </div>
            ))}
          </LiquidCard>

          <LiquidCard lg>
            <h2 style={{ fontSize: 17, fontWeight: 600, marginBottom: 12 }}>Connected Platforms</h2>
            {platforms.map((p) => (
              <div key={p.key} className="sep-b" style={{ display: 'flex', alignItems: 'center', gap: 11, padding: '10px 2px' }}>
                <PlatformIcon platform={p.key as any} />
                <div>
                  <div style={{ fontSize: 14, fontWeight: 500 }}>{p.name}</div>
                  <div style={{ fontSize: 12, color: 'var(--label-secondary)' }}>{p.handle}</div>
                </div>
                <div style={{ marginLeft: 'auto' }}>
                  {p.live ? <span className="badge badge-live">Live</span> : <span className="badge badge-grey">Off</span>}
                </div>
              </div>
            ))}
          </LiquidCard>
        </div>
      </div>
    </>
  )
}
