import { useEffect, useRef, useState } from 'react'
import { TrendingUp, Sparkles, Loader2, AlertCircle, CheckCircle2, ExternalLink } from 'lucide-react'
import { LiquidCard, PageHeader } from '../components/ui'
import { listProfiles, type BusinessProfile } from '../lib/clients'
import {
  getLatestRun, getSignals, triggerTrendRun,
  SOURCE_META, ALL_SOURCES,
  type TrendRun, type TrendSignal, type TrendSource,
} from '../lib/trends'

export default function Trends() {
  const [clients, setClients] = useState<BusinessProfile[]>([])
  const [activeClient, setActiveClient] = useState<string | null>(null)
  const [run, setRun] = useState<TrendRun | null>(null)
  const [signals, setSignals] = useState<TrendSignal[]>([])
  const [sourceFilter, setSourceFilter] = useState<TrendSource | 'all'>('all')
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null)

  // Load client list once
  useEffect(() => {
    listProfiles().then((cs) => {
      setClients(cs)
      if (cs.length) setActiveClient(cs[0].id)
    }).finally(() => setLoading(false))
  }, [])

  // Load trends whenever the active client changes
  useEffect(() => {
    if (!activeClient) return
    loadTrends(activeClient)
    return () => { if (pollRef.current) clearInterval(pollRef.current) }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeClient])

  async function loadTrends(profileId: string) {
    const r = await getLatestRun(profileId)
    setRun(r)
    if (r) {
      setSignals(await getSignals(r.id))
      const running = r.status === 'pending' || r.status === 'processing'
      setRefreshing(running)
      if (running) startPolling(profileId)
    } else {
      setSignals([])
      setRefreshing(false)
    }
  }

  function startPolling(profileId: string) {
    if (pollRef.current) clearInterval(pollRef.current)
    pollRef.current = setInterval(async () => {
      const r = await getLatestRun(profileId)
      setRun(r)
      if (r) setSignals(await getSignals(r.id))
      if (r && (r.status === 'completed' || r.status === 'failed' || r.status === 'partial')) {
        setRefreshing(false)
        if (pollRef.current) clearInterval(pollRef.current)
      }
    }, 4000)
  }

  async function refresh() {
    if (!activeClient) return
    setRefreshing(true)
    await triggerTrendRun(activeClient)
    startPolling(activeClient)
  }

  const visibleSignals = sourceFilter === 'all'
    ? signals
    : signals.filter((s) => s.source === sourceFilter)

  // Count signals per source for the filter chips
  const counts = signals.reduce<Record<string, number>>((acc, s) => {
    acc[s.source] = (acc[s.source] ?? 0) + 1
    return acc
  }, {})

  if (loading) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: 300, gap: 12, color: 'var(--label-tertiary)' }}>
        <Loader2 size={20} style={{ animation: 'spin 1s linear infinite' }} /> Loading…
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      </div>
    )
  }

  return (
    <>
      <PageHeader
        title="Trend Intelligence"
        subtitle="9-source weekly trend engine · ranked by relevance · feeds the calendar"
        action={
          <button className="btn-primary" onClick={refresh} disabled={refreshing}>
            {refreshing
              ? <><Loader2 size={15} style={{ verticalAlign: -2, marginRight: 6, animation: 'spin 1s linear infinite' }} />Running…</>
              : <><Sparkles size={15} style={{ verticalAlign: -2, marginRight: 6 }} />Refresh trends</>}
          </button>
        }
      />

      {/* Client selector */}
      {clients.length > 1 && (
        <div style={{ display: 'flex', gap: 8, marginBottom: 18, flexWrap: 'wrap' }}>
          {clients.map((c) => (
            <button
              key={c.id}
              onClick={() => setActiveClient(c.id)}
              className={activeClient === c.id ? 'btn-primary' : 'btn-secondary'}
              style={{ fontSize: 13, color: activeClient === c.id ? '#fff' : 'var(--label-primary)' }}
            >
              {c.business_name}
            </button>
          ))}
        </div>
      )}

      {/* Run status banner */}
      {run && <RunStatusBanner run={run} refreshing={refreshing} />}

      {/* Running / empty states */}
      {refreshing && signals.length === 0 && (
        <LiquidCard lg style={{ textAlign: 'center', padding: '48px 24px' }}>
          <Loader2 size={36} style={{ animation: 'spin 1s linear infinite', opacity: .5, marginBottom: 14 }} />
          <div style={{ fontSize: 15.5, fontWeight: 600, color: 'var(--label-primary)', marginBottom: 6 }}>Gathering trends across 9 sources…</div>
          <div style={{ fontSize: 13.5, color: 'var(--label-tertiary)' }}>Google Trends, News, Reddit, TikTok, Instagram, YouTube, LinkedIn, SEO & competitor ads — then GPT-4o ranks by relevance.</div>
        </LiquidCard>
      )}

      {!refreshing && !run && (
        <LiquidCard lg style={{ textAlign: 'center', padding: '48px 24px' }}>
          <TrendingUp size={40} style={{ opacity: .18, marginBottom: 14 }} />
          <div style={{ fontSize: 15.5, fontWeight: 600, color: 'var(--label-primary)', marginBottom: 6 }}>No trend run yet</div>
          <div style={{ fontSize: 13.5, color: 'var(--label-tertiary)', marginBottom: 20 }}>Click “Refresh trends” to run the 9-source engine for this client.</div>
          <button className="btn-primary" onClick={refresh} style={{ margin: '0 auto' }}>
            <Sparkles size={15} style={{ marginRight: 7 }} />Run Trend Engine
          </button>
        </LiquidCard>
      )}

      {/* Source filter chips */}
      {signals.length > 0 && (
        <div style={{ display: 'flex', gap: 8, marginBottom: 16, flexWrap: 'wrap' }}>
          <FilterChip label="All" count={signals.length} active={sourceFilter === 'all'} color="var(--blue)" onClick={() => setSourceFilter('all')} />
          {ALL_SOURCES.filter((s) => counts[s]).map((s) => (
            <FilterChip key={s} label={SOURCE_META[s].label} count={counts[s]} active={sourceFilter === s} color={SOURCE_META[s].color} onClick={() => setSourceFilter(s)} />
          ))}
        </div>
      )}

      {/* Signal cards */}
      {visibleSignals.length > 0 && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(320px,1fr))', gap: 16 }}>
          {visibleSignals.map((sig) => <SignalCard key={sig.id} sig={sig} />)}
        </div>
      )}

      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </>
  )
}

function RunStatusBanner({ run, refreshing }: { run: TrendRun; refreshing: boolean }) {
  const meta = {
    completed: { icon: CheckCircle2, color: 'var(--green)', label: 'Completed' },
    partial:   { icon: AlertCircle, color: '#f59e0b', label: 'Partial — some sources failed' },
    failed:    { icon: AlertCircle, color: 'var(--red)', label: 'Failed' },
    processing:{ icon: Loader2, color: '#f59e0b', label: 'Processing' },
    pending:   { icon: Loader2, color: '#f59e0b', label: 'Queued' },
  }[run.status]
  const Icon = meta.icon
  return (
    <LiquidCard style={{ marginBottom: 18 }}>
      <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12 }}>
        <Icon size={18} color={meta.color} style={refreshing ? { animation: 'spin 1s linear infinite', flexShrink: 0, marginTop: 2 } : { flexShrink: 0, marginTop: 2 }} />
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 4 }}>
            <span style={{ fontWeight: 600, fontSize: 14, color: meta.color }}>{meta.label}</span>
            <span style={{ fontSize: 12, color: 'var(--label-tertiary)' }}>
              {run.total_signals} signals · {new Date(run.updated_at).toLocaleDateString(undefined, { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
            </span>
          </div>
          {run.ai_summary && (
            <div style={{ fontSize: 13.5, color: 'var(--label-secondary)', lineHeight: 1.6, marginTop: 6 }}>{run.ai_summary}</div>
          )}
          {run.sources_failed?.length > 0 && (
            <div style={{ fontSize: 12, color: '#f59e0b', marginTop: 8 }}>
              Failed sources: {run.sources_failed.map((s) => SOURCE_META[s as TrendSource]?.label ?? s).join(', ')}
            </div>
          )}
        </div>
      </div>
    </LiquidCard>
  )
}

function FilterChip({ label, count, active, color, onClick }: { label: string; count: number; active: boolean; color: string; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      style={{
        display: 'flex', alignItems: 'center', gap: 6, padding: '6px 12px', borderRadius: 20,
        border: `1.5px solid ${active ? color : 'var(--separator)'}`, cursor: 'pointer',
        background: active ? color : 'var(--fill-secondary)', color: active ? '#fff' : 'var(--label-primary)',
        fontSize: 12.5, fontWeight: active ? 600 : 500, transition: 'all .15s ease',
      }}
    >
      {label}
      <span style={{ fontSize: 11, opacity: .8, padding: '0 5px', borderRadius: 8, background: active ? 'rgba(255,255,255,.25)' : 'var(--fill-tertiary)' }}>{count}</span>
    </button>
  )
}

function SignalCard({ sig }: { sig: TrendSignal }) {
  const meta = SOURCE_META[sig.source]
  const rel = sig.relevance_score ?? 0
  const relColor = rel >= 70 ? 'var(--green)' : rel >= 40 ? '#f59e0b' : 'var(--label-tertiary)'
  return (
    <LiquidCard hover style={{ display: 'flex', flexDirection: 'column' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
        <span className="badge" style={{ background: meta.color, color: '#fff' }}>{meta.label}</span>
        {sig.raw_metric_label && sig.raw_score != null && (
          <span className="badge badge-grey">{Intl.NumberFormat(undefined, { notation: 'compact' }).format(sig.raw_score)} {sig.raw_metric_label}</span>
        )}
        <span className="badge" style={{ marginLeft: 'auto', background: 'transparent', color: relColor, border: `1px solid ${relColor}` }}>
          <TrendingUp size={12} style={{ verticalAlign: -1 }} /> {rel}
        </span>
      </div>

      <div style={{ fontSize: 16, fontWeight: 600, lineHeight: 1.3, marginBottom: 8 }}>{sig.topic}</div>
      {sig.description && (
        <div style={{ fontSize: 13, color: 'var(--label-secondary)', lineHeight: 1.5, marginBottom: 12, display: '-webkit-box', WebkitLineClamp: 3, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
          {sig.description}
        </div>
      )}

      {sig.relevance_reason && (
        <div style={{ fontSize: 12, color: 'var(--label-tertiary)', fontStyle: 'italic', background: 'var(--fill-quaternary)', borderRadius: 8, padding: '8px 10px', marginBottom: 12, lineHeight: 1.45 }}>
          “{sig.relevance_reason}”
        </div>
      )}

      {/* Relevance bar */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginTop: 'auto' }}>
        <div style={{ flex: 1, height: 6, borderRadius: 3, background: 'var(--fill-tertiary)', overflow: 'hidden' }}>
          <div style={{ width: `${rel}%`, height: '100%', background: relColor, borderRadius: 3 }} />
        </div>
        {sig.url && (
          <a href={sig.url} target="_blank" rel="noreferrer" style={{ fontSize: 12, color: 'var(--label-tertiary)', textDecoration: 'none', display: 'flex', alignItems: 'center', gap: 3 }}>
            Source <ExternalLink size={11} />
          </a>
        )}
      </div>

      <button className="btn-secondary" style={{ marginTop: 14, width: '100%', color: 'var(--label-primary)' }}>Add to calendar</button>
    </LiquidCard>
  )
}
