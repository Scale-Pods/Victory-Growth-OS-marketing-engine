import { useEffect, useRef, useState } from 'react'
import {
  Factory, Sparkles, Loader2, CheckCircle2, AlertCircle, Clock, Copy, Check,
  Calendar as CalIcon, Hash, Megaphone,
} from 'lucide-react'
import { LiquidCard, PageHeader } from '../components/ui'
import { listProfiles, type BusinessProfile } from '../lib/clients'
import {
  getLatestContentRun, getContentItems, triggerContentTextRun,
  CONTENT_TYPE_META, ALL_CONTENT_TYPES,
  type ContentRun, type ContentItem, type ContentType,
} from '../lib/content'

export default function ContentFactory() {
  const [clients, setClients] = useState<BusinessProfile[]>([])
  const [activeClient, setActiveClient] = useState<string | null>(null)
  const [run, setRun] = useState<ContentRun | null>(null)
  const [items, setItems] = useState<ContentItem[]>([])
  const [filter, setFilter] = useState<ContentType | 'all'>('all')
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
    const r = await getLatestContentRun(profileId)
    setRun(r)
    if (r) {
      setItems(await getContentItems(r.id))
      const running = r.status === 'pending' || r.status === 'processing'
      setWorking(running)
      if (running) startPolling(profileId)
    } else {
      setItems([])
      setWorking(false)
    }
  }

  function startPolling(profileId: string) {
    if (pollRef.current) clearInterval(pollRef.current)
    pollRef.current = setInterval(async () => {
      const r = await getLatestContentRun(profileId)
      setRun(r)
      if (r) setItems(await getContentItems(r.id))
      if (r && (r.status === 'completed' || r.status === 'failed' || r.status === 'partial')) {
        setWorking(false)
        if (pollRef.current) clearInterval(pollRef.current)
      }
    }, 4000)
  }

  async function generate() {
    if (!activeClient) return
    setWorking(true)
    await triggerContentTextRun(activeClient)
    startPolling(activeClient)
  }

  const visible = filter === 'all' ? items : items.filter((i) => i.content_type === filter)
  const counts = items.reduce<Record<string, number>>((acc, i) => {
    acc[i.content_type] = (acc[i.content_type] ?? 0) + 1
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
        title="Content Factory"
        subtitle="AI-generated content from your approved strategy · copy, hashtags, CTA & SEO per post"
        action={
          <button className="btn-primary" onClick={generate} disabled={working}>
            {working
              ? <><Loader2 size={15} style={{ verticalAlign: -2, marginRight: 6, animation: 'spin 1s linear infinite' }} />Generating…</>
              : <><Sparkles size={15} style={{ verticalAlign: -2, marginRight: 6 }} />{run ? 'Regenerate Content' : 'Generate Content'}</>}
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

      {run && <RunBanner run={run} working={working} />}

      {working && items.length === 0 && (
        <LiquidCard lg style={{ textAlign: 'center', padding: '48px 24px' }}>
          <Loader2 size={36} style={{ animation: 'spin 1s linear infinite', opacity: .5, marginBottom: 14 }} />
          <div style={{ fontSize: 15.5, fontWeight: 600, color: 'var(--label-primary)', marginBottom: 6 }}>Spinning up the content factory…</div>
          <div style={{ fontSize: 13.5, color: 'var(--label-tertiary)' }}>GPT-4o is writing copy, hashtags, CTAs & SEO for every post in your approved strategy.</div>
        </LiquidCard>
      )}

      {!working && !run && (
        <LiquidCard lg style={{ textAlign: 'center', padding: '48px 24px' }}>
          <Factory size={40} style={{ opacity: .18, marginBottom: 14 }} />
          <div style={{ fontSize: 15.5, fontWeight: 600, color: 'var(--label-primary)', marginBottom: 6 }}>No content generated yet</div>
          <div style={{ fontSize: 13.5, color: 'var(--label-tertiary)', marginBottom: 20 }}>Generate ready-to-publish content for every post in this client's approved strategy.</div>
          <button className="btn-primary" onClick={generate} style={{ margin: '0 auto' }}>
            <Sparkles size={15} style={{ marginRight: 7 }} />Generate Content
          </button>
        </LiquidCard>
      )}

      {items.length > 0 && (
        <div style={{ display: 'flex', gap: 8, marginBottom: 16, flexWrap: 'wrap' }}>
          <FilterChip label="All" count={items.length} active={filter === 'all'} color="var(--blue)" onClick={() => setFilter('all')} />
          {ALL_CONTENT_TYPES.filter((t) => counts[t]).map((t) => (
            <FilterChip key={t} label={CONTENT_TYPE_META[t].label} count={counts[t]} active={filter === t} color={CONTENT_TYPE_META[t].color} onClick={() => setFilter(t)} />
          ))}
        </div>
      )}

      {visible.length > 0 && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(360px,1fr))', gap: 16 }}>
          {visible.map((item) => <ContentCard key={item.id} item={item} />)}
        </div>
      )}

      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </>
  )
}

function RunBanner({ run, working }: { run: ContentRun; working: boolean }) {
  const meta = {
    completed: { icon: CheckCircle2, color: 'var(--green)', label: 'Content ready' },
    partial:   { icon: AlertCircle, color: '#f59e0b', label: 'Partial — some items failed' },
    failed:    { icon: AlertCircle, color: 'var(--red)', label: 'Failed' },
    processing:{ icon: Loader2, color: '#f59e0b', label: 'Generating' },
    pending:   { icon: Clock, color: '#f59e0b', label: 'Queued' },
  }[run.status]
  const Icon = meta.icon
  const pct = run.total_items ? Math.round((run.completed_items / run.total_items) * 100) : 0
  return (
    <LiquidCard style={{ marginBottom: 18 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
        <Icon size={18} color={meta.color} style={working ? { animation: 'spin 1s linear infinite', flexShrink: 0 } : { flexShrink: 0 }} />
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <span style={{ fontWeight: 600, fontSize: 14, color: meta.color }}>{meta.label}</span>
            <span style={{ fontSize: 12, color: 'var(--label-tertiary)' }}>
              {run.completed_items}/{run.total_items} pieces · {new Date(run.updated_at).toLocaleDateString(undefined, { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
            </span>
          </div>
          <div style={{ height: 6, borderRadius: 3, background: 'var(--fill-tertiary)', overflow: 'hidden', marginTop: 8 }}>
            <div style={{ width: `${pct}%`, height: '100%', background: meta.color, borderRadius: 3, transition: 'width .3s ease' }} />
          </div>
        </div>
      </div>
    </LiquidCard>
  )
}

function FilterChip({ label, count, active, color, onClick }: { label: string; count: number; active: boolean; color: string; onClick: () => void }) {
  return (
    <button onClick={onClick}
      style={{
        display: 'flex', alignItems: 'center', gap: 6, padding: '6px 12px', borderRadius: 20,
        border: `1.5px solid ${active ? color : 'var(--separator)'}`, cursor: 'pointer',
        background: active ? color : 'var(--fill-secondary)', color: active ? '#fff' : 'var(--label-primary)',
        fontSize: 12.5, fontWeight: active ? 600 : 500, transition: 'all .15s ease',
      }}>
      {label}
      <span style={{ fontSize: 11, opacity: .8, padding: '0 5px', borderRadius: 8, background: active ? 'rgba(255,255,255,.25)' : 'var(--fill-tertiary)' }}>{count}</span>
    </button>
  )
}

function ContentCard({ item }: { item: ContentItem }) {
  const meta = CONTENT_TYPE_META[item.content_type]
  const [copied, setCopied] = useState(false)
  const [expanded, setExpanded] = useState(false)
  const hashtags = item.metadata?.hashtags ?? []

  function copy() {
    const tags = hashtags.length ? '\n\n' + hashtags.map((h) => (h.startsWith('#') ? h : '#' + h)).join(' ') : ''
    navigator.clipboard.writeText((item.body ?? '') + tags).then(() => {
      setCopied(true)
      setTimeout(() => setCopied(false), 1600)
    })
  }

  return (
    <LiquidCard hover style={{ display: 'flex', flexDirection: 'column' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12, flexWrap: 'wrap' }}>
        <span className="badge" style={{ background: meta.color, color: '#fff' }}>{meta.label}</span>
        {item.platform && <span className="badge badge-grey">{item.platform}</span>}
        {item.scheduled_date && (
          <span style={{ fontSize: 11.5, color: 'var(--label-tertiary)', display: 'flex', alignItems: 'center', gap: 3, marginLeft: 'auto' }}>
            <CalIcon size={11} /> {new Date(item.scheduled_date).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
          </span>
        )}
      </div>

      {item.media_url && (
        <img
          src={item.media_url}
          alt={item.title ?? 'Generated visual'}
          loading="lazy"
          style={{ width: '100%', aspectRatio: '1 / 1', objectFit: 'cover', borderRadius: 10, marginBottom: 12, background: 'var(--fill-tertiary)' }}
        />
      )}

      {item.title && <div style={{ fontSize: 15.5, fontWeight: 700, lineHeight: 1.3, marginBottom: 8 }}>{item.title}</div>}

      {item.body && (
        <div style={{
          fontSize: 13, color: 'var(--label-secondary)', lineHeight: 1.55, marginBottom: 10, whiteSpace: 'pre-wrap',
          ...(expanded ? {} : { display: '-webkit-box', WebkitLineClamp: 5, WebkitBoxOrient: 'vertical', overflow: 'hidden' }),
        }}>
          {item.body}
        </div>
      )}
      {item.body && item.body.length > 240 && (
        <button onClick={() => setExpanded(!expanded)} style={{ alignSelf: 'flex-start', background: 'none', border: 'none', color: 'var(--blue)', fontSize: 12, cursor: 'pointer', padding: 0, marginBottom: 10 }}>
          {expanded ? 'Show less' : 'Show more'}
        </button>
      )}

      {hashtags.length > 0 && (
        <div style={{ display: 'flex', gap: 5, flexWrap: 'wrap', marginBottom: 10 }}>
          {hashtags.slice(0, 8).map((h, i) => (
            <span key={i} style={{ fontSize: 11.5, color: meta.color, display: 'flex', alignItems: 'center' }}>
              <Hash size={10} style={{ marginRight: 1 }} />{h.replace(/^#/, '')}
            </span>
          ))}
        </div>
      )}

      {item.metadata?.cta && (
        <div style={{ fontSize: 12.5, color: 'var(--label-secondary)', display: 'flex', alignItems: 'center', gap: 5, marginBottom: 12, background: 'var(--fill-quaternary)', borderRadius: 8, padding: '7px 10px' }}>
          <Megaphone size={13} color={meta.color} /> <b>CTA:</b> {item.metadata.cta}
        </div>
      )}

      <button className="btn-secondary" onClick={copy} style={{ marginTop: 'auto', width: '100%', color: 'var(--label-primary)' }}>
        {copied ? <><Check size={14} style={{ marginRight: 6, verticalAlign: -2 }} />Copied!</> : <><Copy size={14} style={{ marginRight: 6, verticalAlign: -2 }} />Copy content</>}
      </button>
    </LiquidCard>
  )
}
