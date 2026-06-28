import { useEffect, useRef, useState } from 'react'
import {
  Sparkles, Loader2, CheckCircle2, AlertCircle, Clock, Target, CalendarDays,
  Layers, Megaphone, Share2, Magnet, MousePointerClick, ShieldCheck, RefreshCw,
} from 'lucide-react'
import { LiquidCard, PageHeader } from '../components/ui'
import { listProfiles, type BusinessProfile } from '../lib/clients'
import {
  getLatestStrategy, triggerStrategyRun, approveStrategy,
  type MarketingStrategy,
} from '../lib/strategy'

type TabKey = 'campaigns' | 'weekly' | 'pillars' | 'calendar' | 'platforms' | 'leadgen' | 'cta'
const TABS: { key: TabKey; label: string; icon: typeof Target; color: string }[] = [
  { key: 'campaigns', label: 'Campaign Planning', icon: Megaphone, color: '#3b82f6' },
  { key: 'weekly', label: 'Weekly Content', icon: CalendarDays, color: '#8b5cf6' },
  { key: 'pillars', label: 'Content Pillars', icon: Layers, color: '#10b981' },
  { key: 'calendar', label: 'Content Calendar', icon: CalendarDays, color: '#f59e0b' },
  { key: 'platforms', label: 'Platform Strategy', icon: Share2, color: '#e1306c' },
  { key: 'leadgen', label: 'Lead Generation', icon: Magnet, color: '#06b6d4' },
  { key: 'cta', label: 'CTA Strategy', icon: MousePointerClick, color: '#ef4444' },
]

export default function Strategy() {
  const [clients, setClients] = useState<BusinessProfile[]>([])
  const [activeClient, setActiveClient] = useState<string | null>(null)
  const [strategy, setStrategy] = useState<MarketingStrategy | null>(null)
  const [tab, setTab] = useState<TabKey>('campaigns')
  const [loading, setLoading] = useState(true)
  const [working, setWorking] = useState(false)
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null)

  useEffect(() => {
    listProfiles().then((cs) => {
      setClients(cs)
      if (cs.length) setActiveClient(cs[0].id)
    }).finally(() => setLoading(false))
  }, [])

  useEffect(() => {
    if (!activeClient) return
    load(activeClient)
    return () => { if (pollRef.current) clearInterval(pollRef.current) }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeClient])

  async function load(profileId: string) {
    const s = await getLatestStrategy(profileId)
    setStrategy(s)
    const running = s?.status === 'pending' || s?.status === 'processing'
    setWorking(!!running)
    if (running) startPolling(profileId)
  }

  function startPolling(profileId: string) {
    if (pollRef.current) clearInterval(pollRef.current)
    pollRef.current = setInterval(async () => {
      const s = await getLatestStrategy(profileId)
      setStrategy(s)
      if (s && s.status !== 'pending' && s.status !== 'processing') {
        setWorking(false)
        if (pollRef.current) clearInterval(pollRef.current)
      }
    }, 4000)
  }

  async function generate() {
    if (!activeClient) return
    setWorking(true)
    await triggerStrategyRun(activeClient)
    startPolling(activeClient)
  }

  async function approve() {
    if (!strategy) return
    await approveStrategy(strategy.id)
    setStrategy({ ...strategy, status: 'approved', approved_at: new Date().toISOString() })
  }

  if (loading) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: 300, gap: 12, color: 'var(--label-tertiary)' }}>
        <Loader2 size={20} style={{ animation: 'spin 1s linear infinite' }} /> Loading…
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      </div>
    )
  }

  const ready = strategy?.status === 'completed' || strategy?.status === 'approved'

  return (
    <>
      <PageHeader
        title="Marketing Strategy"
        subtitle="AI-generated strategy from your market intelligence + live trends"
        action={
          <button className="btn-primary" onClick={generate} disabled={working}>
            {working
              ? <><Loader2 size={15} style={{ verticalAlign: -2, marginRight: 6, animation: 'spin 1s linear infinite' }} />Generating…</>
              : <><Sparkles size={15} style={{ verticalAlign: -2, marginRight: 6 }} />{strategy ? 'Regenerate' : 'Generate Strategy'}</>}
          </button>
        }
      />

      {clients.length > 1 && (
        <div style={{ display: 'flex', gap: 8, marginBottom: 18, flexWrap: 'wrap' }}>
          {clients.map((c) => (
            <button key={c.id} onClick={() => setActiveClient(c.id)}
              className={activeClient === c.id ? 'btn-primary' : 'btn-secondary'}
              style={{ fontSize: 13, color: activeClient === c.id ? '#fff' : 'var(--label-primary)' }}>
              {c.business_name}
            </button>
          ))}
        </div>
      )}

      {strategy && <StatusBanner strategy={strategy} working={working} onApprove={approve} onRegenerate={generate} />}

      {/* Working / empty states */}
      {working && !ready && (
        <LiquidCard lg style={{ textAlign: 'center', padding: '48px 24px' }}>
          <Loader2 size={36} style={{ animation: 'spin 1s linear infinite', opacity: .5, marginBottom: 14 }} />
          <div style={{ fontSize: 15.5, fontWeight: 600, color: 'var(--label-primary)', marginBottom: 6 }}>Building your marketing strategy…</div>
          <div style={{ fontSize: 13.5, color: 'var(--label-tertiary)' }}>Reading your market intelligence + trend signals, then GPT-4o drafts all 7 strategy components.</div>
        </LiquidCard>
      )}

      {!working && !strategy && (
        <LiquidCard lg style={{ textAlign: 'center', padding: '48px 24px' }}>
          <Target size={40} style={{ opacity: .18, marginBottom: 14 }} />
          <div style={{ fontSize: 15.5, fontWeight: 600, color: 'var(--label-primary)', marginBottom: 6 }}>No strategy yet</div>
          <div style={{ fontSize: 13.5, color: 'var(--label-tertiary)', marginBottom: 20 }}>Generate an AI marketing strategy for this client from their intelligence report and trends.</div>
          <button className="btn-primary" onClick={generate} style={{ margin: '0 auto' }}>
            <Sparkles size={15} style={{ marginRight: 7 }} />Generate Strategy
          </button>
        </LiquidCard>
      )}

      {/* Tabs + content */}
      {ready && (
        <>
          <div style={{ display: 'flex', gap: 8, marginBottom: 18, flexWrap: 'wrap' }}>
            {TABS.map((t) => {
              const Icon = t.icon
              const active = tab === t.key
              return (
                <button key={t.key} onClick={() => setTab(t.key)}
                  style={{
                    display: 'flex', alignItems: 'center', gap: 7, padding: '8px 14px', borderRadius: 20,
                    border: `1.5px solid ${active ? t.color : 'var(--separator)'}`, cursor: 'pointer',
                    background: active ? t.color : 'var(--fill-secondary)', color: active ? '#fff' : 'var(--label-primary)',
                    fontSize: 13, fontWeight: active ? 600 : 500, transition: 'all .15s ease',
                  }}>
                  <Icon size={14} /> {t.label}
                </button>
              )
            })}
          </div>

          <div key={tab} style={{ animation: 'fadeIn .2s ease' }}>
            {tab === 'campaigns' && <CampaignsView s={strategy!} />}
            {tab === 'weekly' && <WeeklyView s={strategy!} />}
            {tab === 'pillars' && <PillarsView s={strategy!} />}
            {tab === 'calendar' && <CalendarView s={strategy!} />}
            {tab === 'platforms' && <PlatformsView s={strategy!} />}
            {tab === 'leadgen' && <LeadGenView s={strategy!} />}
            {tab === 'cta' && <CtaView s={strategy!} />}
          </div>
        </>
      )}

      <style>{`@keyframes spin { to { transform: rotate(360deg); } } @keyframes fadeIn { from { opacity: 0; transform: translateY(4px); } to { opacity: 1; transform: none; } }`}</style>
    </>
  )
}

function StatusBanner({ strategy, working, onApprove, onRegenerate }: { strategy: MarketingStrategy; working: boolean; onApprove: () => void; onRegenerate: () => void }) {
  const meta = {
    approved:  { icon: ShieldCheck, color: 'var(--green)', label: 'Approved' },
    completed: { icon: CheckCircle2, color: 'var(--green)', label: 'Strategy ready — review & approve' },
    processing:{ icon: Loader2, color: '#f59e0b', label: 'Generating' },
    pending:   { icon: Clock, color: '#f59e0b', label: 'Queued' },
    failed:    { icon: AlertCircle, color: 'var(--red)', label: 'Failed' },
  }[strategy.status]
  const Icon = meta.icon
  return (
    <LiquidCard style={{ marginBottom: 18 }}>
      <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12 }}>
        <Icon size={18} color={meta.color} style={working ? { animation: 'spin 1s linear infinite', flexShrink: 0, marginTop: 2 } : { flexShrink: 0, marginTop: 2 }} />
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 4, flexWrap: 'wrap' }}>
            <span style={{ fontWeight: 600, fontSize: 14, color: meta.color }}>{meta.label}</span>
            <span style={{ fontSize: 12, color: 'var(--label-tertiary)' }}>
              {new Date(strategy.updated_at).toLocaleDateString(undefined, { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
            </span>
          </div>
          {strategy.ai_summary && (
            <div style={{ fontSize: 13.5, color: 'var(--label-secondary)', lineHeight: 1.6, marginTop: 6 }}>{strategy.ai_summary}</div>
          )}
        </div>
        {strategy.status === 'completed' && (
          <div style={{ display: 'flex', gap: 8, flexShrink: 0 }}>
            <button className="btn-secondary" onClick={onRegenerate} style={{ color: 'var(--label-secondary)' }}>
              <RefreshCw size={13} style={{ marginRight: 5, verticalAlign: -1 }} />Regenerate
            </button>
            <button className="btn-primary" onClick={onApprove}>
              <CheckCircle2 size={14} style={{ marginRight: 5, verticalAlign: -2 }} />Approve
            </button>
          </div>
        )}
      </div>
    </LiquidCard>
  )
}

// ---- Component views ----

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div style={{ marginBottom: 18 }}>
      <div style={{ fontSize: 12, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '.05em', color: 'var(--label-tertiary)', marginBottom: 10 }}>{title}</div>
      {children}
    </div>
  )
}

function Chips({ items, color = 'var(--blue)' }: { items?: (string | number)[]; color?: string }) {
  if (!items?.length) return null
  return (
    <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginTop: 8 }}>
      {items.map((it, i) => (
        <span key={i} style={{ fontSize: 11.5, padding: '3px 9px', borderRadius: 12, background: 'var(--fill-tertiary)', color: 'var(--label-secondary)', border: `1px solid ${color}33` }}>{String(it)}</span>
      ))}
    </div>
  )
}

function EmptyTab({ label }: { label: string }) {
  return <LiquidCard style={{ padding: '28px 22px', color: 'var(--label-tertiary)', fontSize: 13.5, textAlign: 'center' }}>No {label} were generated in this strategy. Try Regenerate.</LiquidCard>
}

function CampaignsView({ s }: { s: MarketingStrategy }) {
  const campaigns = s.campaign_planning?.campaigns ?? []
  if (!campaigns.length) return <EmptyTab label="campaigns" />
  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(340px,1fr))', gap: 16 }}>
      {campaigns.map((c, i) => (
        <LiquidCard key={i}>
          <div style={{ fontSize: 16, fontWeight: 700, marginBottom: 6 }}>{c.name}</div>
          {c.objective && <div style={{ fontSize: 13, color: 'var(--label-secondary)', marginBottom: 4 }}><b>Objective:</b> {c.objective}</div>}
          {c.duration && <div style={{ fontSize: 12.5, color: 'var(--label-tertiary)', marginBottom: 8 }}>⏱ {c.duration}</div>}
          {c.description && <div style={{ fontSize: 13, color: 'var(--label-secondary)', lineHeight: 1.55, marginBottom: 8 }}>{c.description}</div>}
          {c.channels?.length ? <Section title="Channels"><Chips items={c.channels} /></Section> : null}
          {c.kpis?.length ? <Section title="KPIs"><Chips items={c.kpis} color="var(--green)" /></Section> : null}
        </LiquidCard>
      ))}
    </div>
  )
}

function WeeklyView({ s }: { s: MarketingStrategy }) {
  const weeks = s.weekly_content_strategy?.weeks ?? []
  if (!weeks.length) return <EmptyTab label="weekly plans" />
  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(280px,1fr))', gap: 16 }}>
      {weeks.map((w, i) => (
        <LiquidCard key={i}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
            <span className="badge badge-purple">Week {String(w.week ?? i + 1)}</span>
            {w.post_count != null && <span className="badge badge-grey">{String(w.post_count)} posts</span>}
          </div>
          {w.theme && <div style={{ fontSize: 15, fontWeight: 600, marginBottom: 6 }}>{w.theme}</div>}
          {w.focus && <div style={{ fontSize: 13, color: 'var(--label-secondary)', lineHeight: 1.5, marginBottom: 6 }}>{w.focus}</div>}
          {w.goals && <div style={{ fontSize: 12.5, color: 'var(--label-tertiary)', lineHeight: 1.5 }}><b>Goals:</b> {w.goals}</div>}
        </LiquidCard>
      ))}
    </div>
  )
}

function PillarsView({ s }: { s: MarketingStrategy }) {
  const pillars = s.content_pillars ?? []
  if (!pillars.length) return <EmptyTab label="content pillars" />
  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(300px,1fr))', gap: 16 }}>
      {pillars.map((p, i) => (
        <LiquidCard key={i}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6 }}>
            <div style={{ fontSize: 15.5, fontWeight: 700 }}>{p.pillar}</div>
            {p.target_percentage != null && <span className="badge badge-green">{String(p.target_percentage).replace('%', '')}%</span>}
          </div>
          {p.description && <div style={{ fontSize: 13, color: 'var(--label-secondary)', lineHeight: 1.55, marginBottom: 8 }}>{p.description}</div>}
          {p.example_topics?.length ? <Section title="Example topics"><Chips items={p.example_topics} color="var(--green)" /></Section> : null}
        </LiquidCard>
      ))}
    </div>
  )
}

function CalendarView({ s }: { s: MarketingStrategy }) {
  const posts = s.content_calendar ?? []
  if (!posts.length) return <EmptyTab label="calendar posts" />
  const fmt = (d?: string) => {
    if (!d) return '—'
    const dt = new Date(d)
    return isNaN(dt.getTime()) ? d : dt.toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' })
  }
  return (
    <LiquidCard style={{ padding: 0, overflow: 'hidden' }}>
      <div style={{ display: 'grid', gridTemplateColumns: '120px 110px 1fr 1fr', gap: 0, fontSize: 11.5, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '.04em', color: 'var(--label-tertiary)', padding: '12px 16px', borderBottom: '1px solid var(--separator)' }}>
        <div>Date</div><div>Platform</div><div>Topic</div><div>Hook / CTA</div>
      </div>
      {posts.map((p, i) => (
        <div key={i} style={{ display: 'grid', gridTemplateColumns: '120px 110px 1fr 1fr', gap: 0, padding: '12px 16px', borderBottom: i < posts.length - 1 ? '1px solid var(--separator)' : 'none', alignItems: 'start' }}>
          <div style={{ fontSize: 12.5, fontWeight: 600, color: 'var(--label-primary)' }}>{fmt(p.date)}</div>
          <div><span className="badge badge-blue" style={{ fontSize: 10.5 }}>{p.platform || '—'}</span></div>
          <div style={{ fontSize: 13, color: 'var(--label-primary)', paddingRight: 12 }}>
            <div style={{ fontWeight: 600 }}>{p.topic}</div>
            {p.content_type && <div style={{ fontSize: 11.5, color: 'var(--label-tertiary)', marginTop: 2 }}>{p.content_type}</div>}
          </div>
          <div style={{ fontSize: 12.5, color: 'var(--label-secondary)', lineHeight: 1.5 }}>
            {p.hook && <div style={{ marginBottom: 4 }}>“{p.hook}”</div>}
            {p.cta && <div style={{ fontSize: 11.5, color: 'var(--blue)', fontWeight: 600 }}>→ {p.cta}</div>}
          </div>
        </div>
      ))}
    </LiquidCard>
  )
}

function PlatformsView({ s }: { s: MarketingStrategy }) {
  const platforms = s.platform_strategy ?? []
  if (!platforms.length) return <EmptyTab label="platform plans" />
  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(300px,1fr))', gap: 16 }}>
      {platforms.map((p, i) => (
        <LiquidCard key={i}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
            <div style={{ fontSize: 15.5, fontWeight: 700 }}>{p.platform}</div>
            {p.priority && <span className="badge badge-orange">{p.priority}</span>}
          </div>
          {p.posting_frequency && <div style={{ fontSize: 12.5, color: 'var(--label-tertiary)', marginBottom: 6 }}>📅 {p.posting_frequency}{p.best_times ? ` · ${p.best_times}` : ''}</div>}
          {p.content_focus && <div style={{ fontSize: 13, color: 'var(--label-secondary)', lineHeight: 1.55, marginBottom: 6 }}>{p.content_focus}</div>}
          {p.notes && <div style={{ fontSize: 12.5, color: 'var(--label-tertiary)', fontStyle: 'italic' }}>{p.notes}</div>}
        </LiquidCard>
      ))}
    </div>
  )
}

function LeadGenView({ s }: { s: MarketingStrategy }) {
  const lg = s.lead_generation_strategy
  if (!lg || (!lg.tactics?.length && !lg.lead_magnets?.length && !lg.funnel_stages?.length)) return <EmptyTab label="lead-gen tactics" />
  return (
    <>
      {lg.tactics?.length ? (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(320px,1fr))', gap: 16, marginBottom: 18 }}>
          {lg.tactics.map((t, i) => (
            <LiquidCard key={i}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
                <Magnet size={15} color="#06b6d4" />
                <div style={{ fontSize: 15, fontWeight: 700 }}>{t.name}</div>
              </div>
              {t.channel && <span className="badge badge-blue" style={{ marginBottom: 8, display: 'inline-block' }}>{t.channel}</span>}
              {t.description && <div style={{ fontSize: 13, color: 'var(--label-secondary)', lineHeight: 1.55, marginBottom: 6 }}>{t.description}</div>}
              {t.expected_outcome && <div style={{ fontSize: 12.5, color: 'var(--green)' }}><b>Outcome:</b> {t.expected_outcome}</div>}
            </LiquidCard>
          ))}
        </div>
      ) : null}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
        {lg.lead_magnets?.length ? <LiquidCard><Section title="Lead Magnets"><Chips items={lg.lead_magnets} color="#06b6d4" /></Section></LiquidCard> : null}
        {lg.funnel_stages?.length ? <LiquidCard><Section title="Funnel Stages"><Chips items={lg.funnel_stages} color="#8b5cf6" /></Section></LiquidCard> : null}
      </div>
    </>
  )
}

function CtaView({ s }: { s: MarketingStrategy }) {
  const cta = s.cta_strategy
  if (!cta || (!cta.primary_ctas?.length && !cta.secondary_ctas?.length)) return <EmptyTab label="CTAs" />
  return (
    <>
      {cta.primary_ctas?.length ? (
        <Section title="Primary CTAs">
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(300px,1fr))', gap: 16 }}>
            {cta.primary_ctas.map((c, i) => (
              <LiquidCard key={i}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
                  <MousePointerClick size={15} color="#ef4444" />
                  <div style={{ fontSize: 15, fontWeight: 700 }}>{c.cta}</div>
                </div>
                {c.use_case && <div style={{ fontSize: 13, color: 'var(--label-secondary)', lineHeight: 1.5, marginBottom: 4 }}>{c.use_case}</div>}
                {c.placement && <div style={{ fontSize: 12, color: 'var(--label-tertiary)' }}>📍 {c.placement}</div>}
              </LiquidCard>
            ))}
          </div>
        </Section>
      ) : null}
      {cta.secondary_ctas?.length ? <LiquidCard><Section title="Secondary CTAs"><Chips items={cta.secondary_ctas} color="#ef4444" /></Section></LiquidCard> : null}
    </>
  )
}
