import { useEffect, useRef, useState } from 'react'
import {
  ClipboardCheck, Loader2, CheckCircle2, RefreshCw, Upload, Pencil, Check,
  ThumbsUp, RotateCcw, ExternalLink,
} from 'lucide-react'
import { LiquidCard, PageHeader } from '../components/ui'
import { listProfiles, type BusinessProfile } from '../lib/clients'
import {
  getLatestContentRun, getContentItems,
  approveContentItem, requestRevision, uploadContentImage, updateContentItem,
  CONTENT_TYPE_META,
  type ContentRun, type ContentItem, type ContentItemStatus,
} from '../lib/content'

type ReviewFilter = 'all' | 'needs_review' | 'approved' | 'in_revision'

export default function CreativeReview() {
  const [clients, setClients] = useState<BusinessProfile[]>([])
  const [activeClient, setActiveClient] = useState<string | null>(null)
  const [run, setRun] = useState<ContentRun | null>(null)
  const [items, setItems] = useState<ContentItem[]>([])
  const [filter, setFilter] = useState<ReviewFilter>('needs_review')
  const [loading, setLoading] = useState(true)
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
    if (r) { setItems(await getContentItems(r.id)); ensurePolling(r.id, profileId) }
    else setItems([])
  }

  function ensurePolling(runId: string, profileId: string) {
    if (pollRef.current) clearInterval(pollRef.current)
    pollRef.current = setInterval(async () => {
      const r = await getLatestContentRun(profileId)
      if (r) setItems(await getContentItems(r.id))
    }, 4000)
  }

  async function refresh() { if (activeClient) await load(activeClient) }

  function patchLocal(id: string, patch: Partial<ContentItem>) {
    setItems((prev) => prev.map((it) => (it.id === id ? { ...it, ...patch } : it)))
  }

  async function onApprove(it: ContentItem) {
    patchLocal(it.id, { status: 'approved' })
    await approveContentItem(it.id)
  }
  async function onRevise(it: ContentItem, notes: string) {
    patchLocal(it.id, { status: 'revision' })
    await requestRevision(it.id, notes, it.revision_count)
  }
  async function onUpload(it: ContentItem, file: File) {
    patchLocal(it.id, { status: 'generating' })
    const url = await uploadContentImage(it.id, file)
    if (url) patchLocal(it.id, { status: 'ready', media_url: url })
  }
  async function onSaveBody(it: ContentItem, body: string) {
    patchLocal(it.id, { body })
    await updateContentItem(it.id, { body })
  }

  async function approveAll() {
    const ready = items.filter((i) => i.status === 'ready')
    setItems((prev) => prev.map((it) => (it.status === 'ready' ? { ...it, status: 'approved' as ContentItemStatus } : it)))
    await Promise.all(ready.map((i) => approveContentItem(i.id)))
  }

  const counts = {
    needs_review: items.filter((i) => i.status === 'ready').length,
    approved: items.filter((i) => i.status === 'approved').length,
    in_revision: items.filter((i) => i.status === 'revision' || i.status === 'generating').length,
  }
  const visible = items.filter((i) => {
    if (filter === 'all') return true
    if (filter === 'needs_review') return i.status === 'ready'
    if (filter === 'approved') return i.status === 'approved'
    return i.status === 'revision' || i.status === 'generating'
  })

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
        title="Creative Review"
        subtitle="Designer workspace · approve, revise, or replace each piece before it goes live"
        action={
          <div style={{ display: 'flex', gap: 8 }}>
            <button className="btn-secondary" onClick={refresh} style={{ color: 'var(--label-secondary)' }}><RefreshCw size={14} style={{ marginRight: 6, verticalAlign: -2 }} />Refresh</button>
            {counts.needs_review > 0 && <button className="btn-primary" onClick={approveAll}><CheckCircle2 size={15} style={{ marginRight: 6, verticalAlign: -2 }} />Approve all ({counts.needs_review})</button>}
          </div>
        }
      />

      {clients.length > 1 && (
        <div style={{ display: 'flex', gap: 8, marginBottom: 18, flexWrap: 'wrap' }}>
          {clients.map((c) => (
            <button key={c.id} onClick={() => setActiveClient(c.id)} className={activeClient === c.id ? 'btn-primary' : 'btn-secondary'} style={{ fontSize: 13, color: activeClient === c.id ? '#fff' : 'var(--label-primary)' }}>{c.business_name}</button>
          ))}
        </div>
      )}

      {/* Progress summary */}
      <div style={{ display: 'flex', gap: 12, marginBottom: 18 }}>
        {[
          { label: 'Needs review', value: counts.needs_review, color: '#f59e0b' },
          { label: 'Approved', value: counts.approved, color: 'var(--green)' },
          { label: 'In revision', value: counts.in_revision, color: '#8b5cf6' },
        ].map((s) => (
          <LiquidCard key={s.label} style={{ flex: 1, padding: '12px 16px' }}>
            <div style={{ fontSize: 24, fontWeight: 700, color: s.color, lineHeight: 1 }}>{s.value}</div>
            <div style={{ fontSize: 11.5, color: 'var(--label-tertiary)', textTransform: 'uppercase', letterSpacing: '.04em', marginTop: 4 }}>{s.label}</div>
          </LiquidCard>
        ))}
      </div>

      {!run && (
        <LiquidCard lg style={{ textAlign: 'center', padding: '48px 24px' }}>
          <ClipboardCheck size={40} style={{ opacity: .18, marginBottom: 14 }} />
          <div style={{ fontSize: 15.5, fontWeight: 600, marginBottom: 6 }}>Nothing to review yet</div>
          <div style={{ fontSize: 13.5, color: 'var(--label-tertiary)' }}>Generate content in the Content Factory first, then review it here.</div>
        </LiquidCard>
      )}

      {/* Filters */}
      {items.length > 0 && (
        <div style={{ display: 'flex', gap: 8, marginBottom: 16, flexWrap: 'wrap' }}>
          {([['needs_review', 'Needs review'], ['approved', 'Approved'], ['in_revision', 'In revision'], ['all', 'All']] as [ReviewFilter, string][]).map(([key, label]) => (
            <button key={key} onClick={() => setFilter(key)}
              style={{
                padding: '6px 14px', borderRadius: 20, cursor: 'pointer', fontSize: 12.5, fontWeight: filter === key ? 600 : 500,
                border: `1.5px solid ${filter === key ? 'var(--blue)' : 'var(--separator)'}`,
                background: filter === key ? 'var(--blue)' : 'var(--fill-secondary)', color: filter === key ? '#fff' : 'var(--label-primary)',
              }}>{label}</button>
          ))}
        </div>
      )}

      {visible.length > 0 && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(340px,1fr))', gap: 16 }}>
          {visible.map((it) => (
            <ReviewCard key={it.id} item={it} onApprove={onApprove} onRevise={onRevise} onUpload={onUpload} onSaveBody={onSaveBody} />
          ))}
        </div>
      )}

      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </>
  )
}

const STATUS_PILL: Record<string, { label: string; color: string }> = {
  ready: { label: 'Needs review', color: '#f59e0b' },
  approved: { label: 'Approved', color: 'var(--green)' },
  revision: { label: 'Revising…', color: '#8b5cf6' },
  generating: { label: 'Working…', color: '#8b5cf6' },
}

function ReviewCard({ item, onApprove, onRevise, onUpload, onSaveBody }: {
  item: ContentItem
  onApprove: (i: ContentItem) => void
  onRevise: (i: ContentItem, notes: string) => void
  onUpload: (i: ContentItem, f: File) => void
  onSaveBody: (i: ContentItem, b: string) => void
}) {
  const meta = CONTENT_TYPE_META[item.content_type]
  const pill = STATUS_PILL[item.status] ?? { label: item.status, color: 'var(--label-tertiary)' }
  const [reviseOpen, setReviseOpen] = useState(false)
  const [notes, setNotes] = useState('')
  const [editing, setEditing] = useState(false)
  const [draft, setDraft] = useState(item.body ?? '')
  const fileRef = useRef<HTMLInputElement>(null)
  const busy = item.status === 'revision' || item.status === 'generating'
  const approved = item.status === 'approved'

  return (
    <LiquidCard style={{ display: 'flex', flexDirection: 'column', border: approved ? '1.5px solid var(--green)' : undefined }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10, flexWrap: 'wrap' }}>
        <span className="badge" style={{ background: meta.color, color: '#fff' }}>{meta.label}</span>
        {item.platform && <span className="badge badge-grey">{item.platform}</span>}
        <span className="badge" style={{ marginLeft: 'auto', background: 'transparent', color: pill.color, border: `1px solid ${pill.color}` }}>
          {busy && <Loader2 size={11} style={{ verticalAlign: -1, marginRight: 4, animation: 'spin 1s linear infinite' }} />}{pill.label}
        </span>
      </div>

      {item.media_url ? (
        <img src={item.media_url} alt={item.title ?? ''} loading="lazy" style={{ width: '100%', aspectRatio: '1/1', objectFit: 'cover', borderRadius: 10, marginBottom: 10, background: 'var(--fill-tertiary)', opacity: busy ? .5 : 1 }} />
      ) : (
        <div style={{ width: '100%', aspectRatio: '1/1', borderRadius: 10, marginBottom: 10, background: 'var(--fill-tertiary)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--label-tertiary)', fontSize: 13 }}>
          {busy ? 'Generating image…' : 'No image'}
        </div>
      )}

      {item.title && <div style={{ fontSize: 15, fontWeight: 700, marginBottom: 6 }}>{item.title}</div>}

      {editing ? (
        <div style={{ marginBottom: 10 }}>
          <textarea value={draft} onChange={(e) => setDraft(e.target.value)} rows={6}
            style={{ width: '100%', fontSize: 13, padding: 8, borderRadius: 8, border: '1px solid var(--separator)', background: 'var(--fill-secondary)', color: 'var(--label-primary)', resize: 'vertical' }} />
          <div style={{ display: 'flex', gap: 8, marginTop: 6 }}>
            <button className="btn-primary" style={{ fontSize: 12, padding: '5px 12px' }} onClick={() => { onSaveBody(item, draft); setEditing(false) }}><Check size={12} style={{ marginRight: 4, verticalAlign: -1 }} />Save</button>
            <button className="btn-secondary" style={{ fontSize: 12, padding: '5px 12px', color: 'var(--label-secondary)' }} onClick={() => { setDraft(item.body ?? ''); setEditing(false) }}>Cancel</button>
          </div>
        </div>
      ) : (
        item.body && <div style={{ fontSize: 13, color: 'var(--label-secondary)', lineHeight: 1.5, marginBottom: 10, display: '-webkit-box', WebkitLineClamp: 4, WebkitBoxOrient: 'vertical', overflow: 'hidden', whiteSpace: 'pre-wrap' }}>{item.body}</div>
      )}

      {reviseOpen && (
        <div style={{ marginBottom: 10 }}>
          <textarea value={notes} onChange={(e) => setNotes(e.target.value)} rows={2} placeholder="What should change? (e.g. brighter, show a family, different angle)"
            style={{ width: '100%', fontSize: 12.5, padding: 8, borderRadius: 8, border: '1px solid var(--separator)', background: 'var(--fill-secondary)', color: 'var(--label-primary)', resize: 'vertical' }} />
          <div style={{ display: 'flex', gap: 8, marginTop: 6 }}>
            <button className="btn-primary" style={{ fontSize: 12, padding: '5px 12px', background: '#8b5cf6' }} onClick={() => { onRevise(item, notes || 'Improve quality and relevance'); setReviseOpen(false); setNotes('') }}><RotateCcw size={12} style={{ marginRight: 4, verticalAlign: -1 }} />Regenerate</button>
            <button className="btn-secondary" style={{ fontSize: 12, padding: '5px 12px', color: 'var(--label-secondary)' }} onClick={() => setReviseOpen(false)}>Cancel</button>
          </div>
        </div>
      )}

      {/* Actions */}
      {!editing && !reviseOpen && (
        <div style={{ marginTop: 'auto', display: 'flex', flexDirection: 'column', gap: 8 }}>
          <div style={{ display: 'flex', gap: 8 }}>
            <button className="btn-primary" disabled={busy || approved} onClick={() => onApprove(item)} style={{ flex: 1, fontSize: 12.5, background: approved ? 'var(--green)' : undefined, opacity: approved ? .7 : 1 }}>
              <ThumbsUp size={13} style={{ marginRight: 5, verticalAlign: -2 }} />{approved ? 'Approved' : 'Approve'}
            </button>
            <button className="btn-secondary" disabled={busy} onClick={() => setReviseOpen(true)} style={{ flex: 1, fontSize: 12.5, color: 'var(--label-primary)' }}>
              <RotateCcw size={13} style={{ marginRight: 5, verticalAlign: -2 }} />Revise
            </button>
          </div>
          <div style={{ display: 'flex', gap: 8 }}>
            <button className="btn-secondary" disabled={busy} onClick={() => fileRef.current?.click()} style={{ flex: 1, fontSize: 12, color: 'var(--label-secondary)' }}>
              <Upload size={12} style={{ marginRight: 5, verticalAlign: -2 }} />Replace
            </button>
            <button className="btn-secondary" disabled={busy} onClick={() => { setDraft(item.body ?? ''); setEditing(true) }} style={{ flex: 1, fontSize: 12, color: 'var(--label-secondary)' }}>
              <Pencil size={12} style={{ marginRight: 5, verticalAlign: -2 }} />Edit copy
            </button>
          </div>
          <div style={{ display: 'flex', gap: 12, justifyContent: 'center', paddingTop: 2 }}>
            <a href="https://www.canva.com/" target="_blank" rel="noreferrer" style={{ fontSize: 11, color: 'var(--label-tertiary)', textDecoration: 'none', display: 'flex', alignItems: 'center', gap: 3 }}>Canva <ExternalLink size={10} /></a>
            <a href="https://www.figma.com/" target="_blank" rel="noreferrer" style={{ fontSize: 11, color: 'var(--label-tertiary)', textDecoration: 'none', display: 'flex', alignItems: 'center', gap: 3 }}>Figma <ExternalLink size={10} /></a>
          </div>
          <input ref={fileRef} type="file" accept="image/*" style={{ display: 'none' }} onChange={(e) => { const f = e.target.files?.[0]; if (f) onUpload(item, f); e.target.value = '' }} />
        </div>
      )}
    </LiquidCard>
  )
}
