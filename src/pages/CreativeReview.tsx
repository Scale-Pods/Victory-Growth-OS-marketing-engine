import { useEffect, useRef, useState } from 'react'
import {
  ClipboardCheck, Loader2, CheckCircle2, RefreshCw, Upload, Pencil, Check,
  ThumbsUp, RotateCcw, ExternalLink, Send, X, Image as ImageIcon, Link2, Palette, Crop,
} from 'lucide-react'
import { LiquidCard, PageHeader } from '../components/ui'
import { PlatformBadge, CarouselViewer } from '../components/mediaUi'
import { MediaEditor } from '../components/MediaEditor'
import { listProfiles, type BusinessProfile } from '../lib/clients'
import {
  getLatestContentRun, getContentItems,
  approveContentItem, requestRevision, updateContentItem,
  uploadContentMedia, submitForApproval, rejectContentItem,
  listCanvaDesigns, importCanvaDesign, importFigmaFrame,
  getRole, setRole, GENERATION_ENABLED,
  CANVA_CONNECT_URL, CONTENT_TYPE_META,
  type ContentRun, type ContentItem, type ContentItemStatus, type Role, type CanvaDesign,
} from '../lib/content'

type ReviewFilter = 'all' | 'todo' | 'pending' | 'approved'

export default function CreativeReview() {
  const [role, setRoleState] = useState<Role>(getRole())
  const [clients, setClients] = useState<BusinessProfile[]>([])
  const [activeClient, setActiveClient] = useState<string | null>(null)
  const [run, setRun] = useState<ContentRun | null>(null)
  const [items, setItems] = useState<ContentItem[]>([])
  const [filter, setFilter] = useState<ReviewFilter>('todo')
  const [loading, setLoading] = useState(true)
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null)

  const isDesigner = role === 'designer'

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

  // designers default to their to-do list, admins to the approval queue
  useEffect(() => { setFilter(isDesigner ? 'todo' : 'pending') }, [isDesigner])

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

  function changeRole(r: Role) { setRole(r); setRoleState(r) }

  async function onApprove(it: ContentItem) { patchLocal(it.id, { status: 'approved' }); await approveContentItem(it.id) }
  async function onReject(it: ContentItem) { patchLocal(it.id, { status: 'ready' }); await rejectContentItem(it.id) }
  async function onSubmit(it: ContentItem) { patchLocal(it.id, { status: 'in_review' }); await submitForApproval(it.id) }
  async function onRevise(it: ContentItem, notes: string) { patchLocal(it.id, { status: 'revision' }); await requestRevision(it.id, notes, it.revision_count) }
  async function onSaveBody(it: ContentItem, body: string) { patchLocal(it.id, { body }); await updateContentItem(it.id, { body }) }
  function onReplaced(id: string, url: string) { patchLocal(id, { media_url: url, status: 'in_review' }) }

  async function approveAll() {
    const pend = items.filter((i) => i.status === 'in_review')
    setItems((prev) => prev.map((it) => (it.status === 'in_review' ? { ...it, status: 'approved' as ContentItemStatus } : it)))
    await Promise.all(pend.map((i) => approveContentItem(i.id)))
  }

  const counts = {
    todo: items.filter((i) => i.status === 'ready' || i.status === 'revision').length,
    pending: items.filter((i) => i.status === 'in_review').length,
    approved: items.filter((i) => i.status === 'approved').length,
  }
  const visible = items.filter((i) => {
    if (filter === 'all') return true
    if (filter === 'todo') return i.status === 'ready' || i.status === 'revision' || i.status === 'generating'
    if (filter === 'pending') return i.status === 'in_review'
    return i.status === 'approved'
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
        title="Designer Workspace"
        subtitle={isDesigner
          ? 'Edit copy, replace visuals (upload · Figma · Canva), then submit for approval'
          : 'Review submitted work — approve or send back to the designer'}
        action={
          <div style={{ display: 'flex', gap: 8 }}>
            <button className="btn-secondary" onClick={refresh} style={{ color: 'var(--label-secondary)' }}><RefreshCw size={14} style={{ marginRight: 6, verticalAlign: -2 }} />Refresh</button>
            {!isDesigner && counts.pending > 0 && <button className="btn-primary" onClick={approveAll}><CheckCircle2 size={15} style={{ marginRight: 6, verticalAlign: -2 }} />Approve all ({counts.pending})</button>}
          </div>
        }
      />

      {/* Role switcher (single-login demo: switch the workspace view) */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 16, flexWrap: 'wrap' }}>
        <span style={{ fontSize: 12, color: 'var(--label-tertiary)' }}>Viewing as</span>
        {(['designer', 'admin', 'client'] as Role[]).map((r) => (
          <button key={r} onClick={() => changeRole(r)}
            style={{
              padding: '5px 12px', borderRadius: 20, cursor: 'pointer', fontSize: 12, textTransform: 'capitalize',
              fontWeight: role === r ? 600 : 500,
              border: `1.5px solid ${role === r ? 'var(--blue)' : 'var(--separator)'}`,
              background: role === r ? 'var(--blue)' : 'var(--fill-secondary)', color: role === r ? '#fff' : 'var(--label-primary)',
            }}>{r}</button>
        ))}
      </div>

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
          { key: 'todo', label: isDesigner ? 'To work on' : 'In progress', value: counts.todo, color: '#f59e0b' },
          { key: 'pending', label: 'Pending approval', value: counts.pending, color: '#8b5cf6' },
          { key: 'approved', label: 'Approved', value: counts.approved, color: 'var(--green)' },
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
          <div style={{ fontSize: 15.5, fontWeight: 600, marginBottom: 6 }}>Nothing here yet</div>
          <div style={{ fontSize: 13.5, color: 'var(--label-tertiary)' }}>Generate content in the Content Factory first, then work on it here.</div>
        </LiquidCard>
      )}

      {items.length > 0 && (
        <div style={{ display: 'flex', gap: 8, marginBottom: 16, flexWrap: 'wrap' }}>
          {([['todo', isDesigner ? 'To work on' : 'In progress'], ['pending', 'Pending approval'], ['approved', 'Approved'], ['all', 'All']] as [ReviewFilter, string][]).map(([key, label]) => (
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
            <ReviewCard key={it.id} item={it} role={role}
              onApprove={onApprove} onReject={onReject} onSubmit={onSubmit}
              onRevise={onRevise} onSaveBody={onSaveBody} onReplaced={onReplaced} />
          ))}
        </div>
      )}

      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </>
  )
}

const STATUS_PILL: Record<string, { label: string; color: string }> = {
  ready: { label: 'To work on', color: '#f59e0b' },
  revision: { label: 'Revising…', color: '#8b5cf6' },
  generating: { label: 'Working…', color: '#8b5cf6' },
  in_review: { label: 'Pending approval', color: '#8b5cf6' },
  approved: { label: 'Approved', color: 'var(--green)' },
}

function ReviewCard({ item, role, onApprove, onReject, onSubmit, onRevise, onSaveBody, onReplaced }: {
  item: ContentItem
  role: Role
  onApprove: (i: ContentItem) => void
  onReject: (i: ContentItem) => void
  onSubmit: (i: ContentItem) => void
  onRevise: (i: ContentItem, notes: string) => void
  onSaveBody: (i: ContentItem, b: string) => void
  onReplaced: (id: string, url: string) => void
}) {
  const meta = CONTENT_TYPE_META[item.content_type]
  const pill = STATUS_PILL[item.status] ?? { label: item.status, color: 'var(--label-tertiary)' }
  const [reviseOpen, setReviseOpen] = useState(false)
  const [notes, setNotes] = useState('')
  const [editing, setEditing] = useState(false)
  const [draft, setDraft] = useState(item.body ?? '')
  const [replaceOpen, setReplaceOpen] = useState(false)
  const [editorOpen, setEditorOpen] = useState(false)
  const busy = item.status === 'revision' || item.status === 'generating'
  const approved = item.status === 'approved'
  const isDesigner = role === 'designer'
  const editableImage = meta.kind !== 'video' && !!(item.metadata?.slides?.length || item.media_url)

  return (
    <LiquidCard style={{ display: 'flex', flexDirection: 'column', border: approved ? '1.5px solid var(--green)' : undefined }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10, flexWrap: 'wrap' }}>
        <span className="badge" style={{ background: meta.color, color: '#fff' }}>{meta.label}</span>
        {item.platform && <PlatformBadge platform={item.platform} size="sm" />}
        <span className="badge" style={{ marginLeft: 'auto', background: 'transparent', color: pill.color, border: `1px solid ${pill.color}` }}>
          {busy && <Loader2 size={11} style={{ verticalAlign: -1, marginRight: 4, animation: 'spin 1s linear infinite' }} />}{pill.label}
        </span>
      </div>

      {item.content_type === 'carousel' && (item.metadata?.slides?.length ?? 0) > 0 ? (
        <CarouselViewer slides={item.metadata!.slides!} />
      ) : item.media_url ? (
        meta.kind === 'video' ? (
          <video src={item.media_url} controls playsInline preload="metadata" poster={item.thumbnail_url ?? undefined}
            style={{ width: '100%', aspectRatio: item.content_type === 'ugc_video' ? '9 / 16' : '16 / 9', objectFit: 'contain', borderRadius: 10, marginBottom: 10, background: '#000', opacity: busy ? .5 : 1 }} />
        ) : (
          <img src={item.media_url} alt={item.title ?? ''} loading="lazy" style={{ width: '100%', aspectRatio: '1/1', objectFit: 'cover', borderRadius: 10, marginBottom: 10, background: 'var(--fill-tertiary)', opacity: busy ? .5 : 1 }} />
        )
      ) : (
        <div style={{ width: '100%', aspectRatio: meta.kind === 'video' ? '16 / 9' : '1/1', borderRadius: 10, marginBottom: 10, background: 'var(--fill-tertiary)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--label-tertiary)', fontSize: 13 }}>
          {busy ? 'Generating…' : meta.kind === 'video' ? 'No video' : meta.kind === 'text' ? 'Text content' : 'No image'}
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

      {item.review_notes && (
        <div style={{ fontSize: 12, color: '#b45309', background: 'rgba(245,158,11,.12)', borderRadius: 8, padding: '6px 9px', marginBottom: 10 }}>
          <b>Feedback:</b> {item.review_notes}
        </div>
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
          {isDesigner ? (
            <button className="btn-primary" disabled={busy || approved} onClick={() => onSubmit(item)}
              style={{ fontSize: 12.5, background: item.status === 'in_review' ? '#8b5cf6' : undefined, opacity: approved ? .7 : 1 }}>
              <Send size={13} style={{ marginRight: 5, verticalAlign: -2 }} />
              {approved ? 'Approved' : item.status === 'in_review' ? 'Submitted — resubmit' : 'Submit for approval'}
            </button>
          ) : (
            <div style={{ display: 'flex', gap: 8 }}>
              <button className="btn-primary" disabled={busy || approved} onClick={() => onApprove(item)} style={{ flex: 1, fontSize: 12.5, background: approved ? 'var(--green)' : undefined, opacity: approved ? .7 : 1 }}>
                <ThumbsUp size={13} style={{ marginRight: 5, verticalAlign: -2 }} />{approved ? 'Approved' : 'Approve'}
              </button>
              <button className="btn-secondary" disabled={busy || item.status !== 'in_review'} onClick={() => onReject(item)} style={{ flex: 1, fontSize: 12.5, color: 'var(--label-primary)' }}>
                <RotateCcw size={13} style={{ marginRight: 5, verticalAlign: -2 }} />Send back
              </button>
            </div>
          )}

          <div style={{ display: 'flex', gap: 8 }}>
            <button className="btn-secondary" disabled={busy} onClick={() => setReplaceOpen(true)} style={{ flex: 1, fontSize: 12, color: 'var(--label-secondary)' }}>
              <Upload size={12} style={{ marginRight: 5, verticalAlign: -2 }} />Replace
            </button>
            <button className="btn-secondary" disabled={busy} onClick={() => { setDraft(item.body ?? ''); setEditing(true) }} style={{ flex: 1, fontSize: 12, color: 'var(--label-secondary)' }}>
              <Pencil size={12} style={{ marginRight: 5, verticalAlign: -2 }} />Edit copy
            </button>
          </div>
          {editableImage && (
            <button className="btn-secondary" disabled={busy} onClick={() => setEditorOpen(true)} style={{ fontSize: 12, color: 'var(--label-secondary)' }}>
              <Crop size={12} style={{ marginRight: 5, verticalAlign: -2 }} />Customize &amp; resize (per platform)
            </button>
          )}

          {!isDesigner && (
            <button className="btn-secondary" disabled={busy || !GENERATION_ENABLED} onClick={() => setReviseOpen(true)}
              title={!GENERATION_ENABLED ? 'AI regeneration is disabled in demo mode' : undefined}
              style={{ fontSize: 12, color: 'var(--label-secondary)', ...(!GENERATION_ENABLED ? { opacity: 0.5, cursor: 'not-allowed' } : {}) }}>
              <RotateCcw size={12} style={{ marginRight: 5, verticalAlign: -2 }} />Revise with AI
            </button>
          )}
        </div>
      )}

      {replaceOpen && <ReplaceModal item={item} onClose={() => setReplaceOpen(false)} onReplaced={onReplaced} />}
      {editorOpen && (
        <MediaEditor
          src={(item.metadata?.slides?.[0] || item.media_url)!}
          itemId={item.id}
          caption={item.body}
          onClose={() => setEditorOpen(false)}
          onSaved={(url) => { onReplaced(item.id, url); setEditorOpen(false) }}
        />
      )}
    </LiquidCard>
  )
}

// ───────────────────────── Replace media modal ─────────────────────────
type Tab = 'local' | 'figma' | 'canva'

function ReplaceModal({ item, onClose, onReplaced }: { item: ContentItem; onClose: () => void; onReplaced: (id: string, url: string) => void }) {
  const [tab, setTab] = useState<Tab>('local')
  const fileRef = useRef<HTMLInputElement>(null)
  const [busy, setBusy] = useState(false)
  const [msg, setMsg] = useState<string | null>(null)
  const [figmaUrl, setFigmaUrl] = useState('')
  const [canva, setCanva] = useState<{ connected: boolean; designs: CanvaDesign[] } | null>(null)
  const [canvaFmt, setCanvaFmt] = useState<'png' | 'mp4'>('png')

  async function loadCanva() {
    setCanva(null)
    setCanva(await listCanvaDesigns())
  }
  useEffect(() => { if (tab === 'canva' && !canva) loadCanva() // eslint-disable-next-line
  }, [tab])

  async function doLocal(file: File) {
    setBusy(true); setMsg('Uploading…')
    const url = await uploadContentMedia(item.id, file)
    setBusy(false)
    if (url) { onReplaced(item.id, url); setMsg('Replaced ✓'); setTimeout(onClose, 700) }
    else setMsg('Upload failed')
  }
  async function doFigma() {
    if (!figmaUrl.trim()) return
    setBusy(true); setMsg('Importing from Figma…')
    const url = await importFigmaFrame(item.id, figmaUrl.trim())
    setBusy(false)
    if (url) { onReplaced(item.id, url); setMsg('Imported ✓'); setTimeout(onClose, 700) }
    else setMsg('Import failed — copy a FRAME link (right-click a frame → Copy link to selection)')
  }
  async function doCanva(d: CanvaDesign) {
    setBusy(true); setMsg(`Importing "${d.title ?? 'design'}"…`)
    const url = await importCanvaDesign(item.id, d.id, canvaFmt)
    setBusy(false)
    if (url) { onReplaced(item.id, url); setMsg('Imported ✓'); setTimeout(onClose, 700) }
    else setMsg('Import failed — try again')
  }

  const TABS: [Tab, string, typeof ImageIcon][] = [['local', 'Upload', ImageIcon], ['figma', 'Figma', Link2], ['canva', 'Canva', Palette]]

  return (
    <div onClick={onClose} style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,.5)', backdropFilter: 'blur(4px)', zIndex: 100, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16 }}>
      <div onClick={(e) => e.stopPropagation()} style={{ width: 'min(560px,100%)', maxHeight: '86vh', overflowY: 'auto', background: 'var(--bg-elevated, #1b1b1f)', border: '1px solid var(--separator)', borderRadius: 16, padding: 20, boxShadow: '0 24px 60px rgba(0,0,0,.4)' }}>
        <div style={{ display: 'flex', alignItems: 'center', marginBottom: 14 }}>
          <div style={{ fontSize: 16, fontWeight: 700 }}>Replace media</div>
          <button onClick={onClose} style={{ marginLeft: 'auto', background: 'none', border: 'none', cursor: 'pointer', color: 'var(--label-tertiary)' }}><X size={18} /></button>
        </div>

        <div style={{ display: 'flex', gap: 8, marginBottom: 16 }}>
          {TABS.map(([t, label, Icon]) => (
            <button key={t} onClick={() => { setTab(t); setMsg(null) }}
              style={{
                flex: 1, padding: '8px 10px', borderRadius: 10, cursor: 'pointer', fontSize: 12.5, fontWeight: tab === t ? 600 : 500,
                border: `1.5px solid ${tab === t ? 'var(--blue)' : 'var(--separator)'}`,
                background: tab === t ? 'var(--blue)' : 'var(--fill-secondary)', color: tab === t ? '#fff' : 'var(--label-primary)',
              }}><Icon size={13} style={{ marginRight: 6, verticalAlign: -2 }} />{label}</button>
          ))}
        </div>

        {tab === 'local' && (
          <div style={{ textAlign: 'center', padding: '24px 12px', border: '1.5px dashed var(--separator)', borderRadius: 12 }}>
            <Upload size={30} style={{ opacity: .4, marginBottom: 10 }} />
            <div style={{ fontSize: 13.5, marginBottom: 4 }}>Upload an image or video from your computer</div>
            <div style={{ fontSize: 11.5, color: 'var(--label-tertiary)', marginBottom: 14 }}>PNG, JPG, MP4 · replaces this item's media</div>
            <button className="btn-primary" disabled={busy} onClick={() => fileRef.current?.click()}>Choose file</button>
            <input ref={fileRef} type="file" accept="image/*,video/*" style={{ display: 'none' }} onChange={(e) => { const f = e.target.files?.[0]; if (f) doLocal(f); e.target.value = '' }} />
          </div>
        )}

        {tab === 'figma' && (
          <div>
            <div style={{ fontSize: 12.5, color: 'var(--label-secondary)', marginBottom: 8 }}>Paste a Figma <b>frame</b> link (right-click a frame → Copy link). We export it as a PNG.</div>
            <input value={figmaUrl} onChange={(e) => setFigmaUrl(e.target.value)} placeholder="https://www.figma.com/design/…?node-id=1-2"
              style={{ width: '100%', fontSize: 12.5, padding: 10, borderRadius: 10, border: '1px solid var(--separator)', background: 'var(--fill-secondary)', color: 'var(--label-primary)', marginBottom: 12 }} />
            <button className="btn-primary" disabled={busy || !figmaUrl.trim()} onClick={doFigma}><Link2 size={13} style={{ marginRight: 6, verticalAlign: -2 }} />Import from Figma</button>
          </div>
        )}

        {tab === 'canva' && (
          <div>
            {!canva && <div style={{ textAlign: 'center', padding: 24, color: 'var(--label-tertiary)' }}><Loader2 size={20} style={{ animation: 'spin 1s linear infinite' }} /></div>}
            {canva && !canva.connected && (
              <div style={{ textAlign: 'center', padding: '24px 12px' }}>
                <Palette size={30} style={{ opacity: .4, marginBottom: 10 }} />
                <div style={{ fontSize: 13.5, marginBottom: 14 }}>Connect your Canva account to import designs</div>
                <button className="btn-primary" onClick={() => { window.open(CANVA_CONNECT_URL, '_blank', 'width=620,height=760'); }}>Connect Canva</button>
                <div style={{ fontSize: 11, color: 'var(--label-tertiary)', marginTop: 10 }}>After connecting, reopen this tab.</div>
                <button className="btn-secondary" onClick={loadCanva} style={{ marginTop: 10, fontSize: 12, color: 'var(--label-secondary)' }}>I've connected — refresh</button>
              </div>
            )}
            {canva && canva.connected && (
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 }}>
                  <span style={{ fontSize: 11.5, color: 'var(--label-tertiary)' }}>Import as</span>
                  {(['png', 'mp4'] as const).map((f) => (
                    <button key={f} onClick={() => setCanvaFmt(f)} style={{ padding: '3px 10px', borderRadius: 14, fontSize: 11, textTransform: 'uppercase', cursor: 'pointer', border: `1.5px solid ${canvaFmt === f ? 'var(--blue)' : 'var(--separator)'}`, background: canvaFmt === f ? 'var(--blue)' : 'transparent', color: canvaFmt === f ? '#fff' : 'var(--label-secondary)' }}>{f}</button>
                  ))}
                  <button className="btn-secondary" onClick={loadCanva} style={{ marginLeft: 'auto', fontSize: 11, color: 'var(--label-tertiary)', padding: '3px 8px' }}><RefreshCw size={11} /></button>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2,1fr)', gap: 10, maxHeight: '46vh', overflowY: 'auto' }}>
                  {canva.designs.map((d) => (
                    <div key={d.id} style={{ border: '1px solid var(--separator)', borderRadius: 10, overflow: 'hidden', background: 'var(--fill-secondary)' }}>
                      {d.thumbnail
                        ? <img src={d.thumbnail} alt={d.title ?? ''} style={{ width: '100%', height: 90, objectFit: 'cover', display: 'block' }} />
                        : <div style={{ height: 90, background: 'var(--fill-tertiary)' }} />}
                      <div style={{ padding: 8 }}>
                        <div style={{ fontSize: 11.5, fontWeight: 600, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', marginBottom: 6 }}>{d.title ?? 'Untitled'}</div>
                        <div style={{ display: 'flex', gap: 6 }}>
                          <button className="btn-primary" disabled={busy} onClick={() => doCanva(d)} style={{ flex: 1, fontSize: 11, padding: '4px 8px' }}>Import</button>
                          {d.edit_url && <a href={d.edit_url} target="_blank" rel="noreferrer" title="Edit in Canva (with Canva AI)" className="btn-secondary" style={{ fontSize: 11, padding: '4px 8px', color: 'var(--label-secondary)', textDecoration: 'none', display: 'flex', alignItems: 'center' }}><ExternalLink size={11} /></a>}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {msg && <div style={{ fontSize: 12.5, color: 'var(--label-secondary)', marginTop: 14, textAlign: 'center' }}>{busy && <Loader2 size={12} style={{ verticalAlign: -2, marginRight: 6, animation: 'spin 1s linear infinite' }} />}{msg}</div>}
      </div>
    </div>
  )
}
