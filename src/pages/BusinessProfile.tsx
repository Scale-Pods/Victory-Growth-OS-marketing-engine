import { useEffect, useRef, useState } from 'react'
import { Link, useParams, useLocation } from 'react-router-dom'
import { ChevronLeft, Pencil, Check, ExternalLink, Brain, Loader2, RefreshCw, AlertCircle } from 'lucide-react'
import { LiquidCard } from '../components/ui'
import AssetUploader from '../components/AssetUploader'
import { platformMeta } from '../data/dummy'
import { getProfile, updateProfile, type BusinessProfile } from '../lib/clients'
import { supabase } from '../lib/supabase'

const N8N_WEBHOOK = 'https://n8n.srv1010832.hstgr.cloud/webhook/ai-analysis'

const URL_RE = /https?:\/\/[^\s]+/g

type BiReport = {
  id: string
  profile_id: string
  status: 'pending' | 'processing' | 'completed' | 'failed'
  website_analysis: string | null
  instagram_analysis: string | null
  facebook_analysis: string | null
  linkedin_analysis: string | null
  competitor_analysis: string | null
  seo_analysis: string | null
  audience_analysis: string | null
  full_report: string | null
  error_message: string | null
  created_at: string
  updated_at: string
}

function renderMarkdown(text: string) {
  return text.split('\n').map((line, i) => {
    if (line.startsWith('# '))
      return <h2 key={i} style={{ fontSize: 22, fontWeight: 700, margin: '22px 0 8px', color: 'var(--label-primary)', letterSpacing: '-.02em' }}>{line.slice(2)}</h2>
    if (line.startsWith('## '))
      return <h3 key={i} style={{ fontSize: 17, fontWeight: 600, margin: '18px 0 6px', color: 'var(--label-primary)' }}>{line.slice(3)}</h3>
    if (line.startsWith('### '))
      return <h4 key={i} style={{ fontSize: 14.5, fontWeight: 600, margin: '14px 0 4px', color: 'var(--label-secondary)', textTransform: 'uppercase', letterSpacing: '.04em' }}>{line.slice(4)}</h4>
    if (line.startsWith('- ') || line.startsWith('* '))
      return <li key={i} style={{ fontSize: 14, lineHeight: 1.65, color: 'var(--label-primary)', marginLeft: 18, marginBottom: 3 }}>{line.slice(2)}</li>
    if (line.startsWith('**') && line.endsWith('**'))
      return <p key={i} style={{ fontSize: 14, lineHeight: 1.65, fontWeight: 600, color: 'var(--label-primary)', margin: '4px 0' }}>{line.slice(2, -2)}</p>
    if (line.trim() === '')
      return <br key={i} />
    return <p key={i} style={{ fontSize: 14, lineHeight: 1.65, color: 'var(--label-primary)', margin: '3px 0' }}>{line}</p>
  })
}

function linkStyle(): React.CSSProperties {
  return { color: 'var(--blue)', textDecoration: 'none', wordBreak: 'break-all', display: 'inline-flex', alignItems: 'center', gap: 3 }
}

function renderValue(fieldKey: FieldKey, raw: string) {
  if (!raw) return <span style={{ color: 'var(--label-tertiary)' }}>—</span>

  if (fieldKey === 'website_url') {
    return (
      <a href={raw.startsWith('http') ? raw : `https://${raw}`} target="_blank" rel="noopener noreferrer" style={linkStyle()}>
        {raw}<ExternalLink size={12} />
      </a>
    )
  }

  if (fieldKey === 'email') {
    return <a href={`mailto:${raw}`} style={linkStyle()}>{raw}</a>
  }

  if (fieldKey === 'phone') {
    return <a href={`tel:${raw.replace(/\s/g, '')}`} style={{ ...linkStyle(), color: 'var(--label-primary)' }}>{raw}</a>
  }

  // For any field that may contain URLs (social_media_urls, etc.) — linkify inline
  if (URL_RE.test(raw)) {
    URL_RE.lastIndex = 0
    const parts: React.ReactNode[] = []
    let last = 0, m: RegExpExecArray | null
    while ((m = URL_RE.exec(raw)) !== null) {
      if (m.index > last) parts.push(raw.slice(last, m.index))
      const url = m[0].replace(/[.,)]+$/, '') // trim trailing punctuation
      parts.push(
        <a key={m.index} href={url} target="_blank" rel="noopener noreferrer" style={linkStyle()}>
          {url}<ExternalLink size={11} />
        </a>
      )
      last = m.index + url.length
    }
    if (last < raw.length) parts.push(raw.slice(last))
    return <div style={{ fontSize: 14.5, lineHeight: 1.6, whiteSpace: 'pre-wrap' }}>{parts}</div>
  }

  return <div style={{ fontSize: 14.5, lineHeight: 1.47, whiteSpace: 'pre-wrap' }}>{raw}</div>
}

type FieldKey = keyof BusinessProfile
const sections: { key: FieldKey; label: string; area?: boolean; full?: boolean }[] = [
  { key: 'business_name', label: 'Business name' },
  { key: 'tagline', label: 'Tagline' },
  { key: 'industry', label: 'Industry' },
  { key: 'description', label: 'Business details', area: true, full: true },
  { key: 'products_services', label: 'Products & services', area: true, full: true },
  { key: 'target_audience', label: 'Target audience', area: true, full: true },
  { key: 'business_goals', label: 'Business goals', area: true, full: true },
  { key: 'brand_guidelines', label: 'Brand guidelines', area: true },
  { key: 'brand_voice', label: 'Brand voice', area: true },
  { key: 'competitors', label: 'Competitors', area: true },
  { key: 'website_url', label: 'Website URL' },
  { key: 'social_media_urls', label: 'Social media URLs', area: true, full: true },
  { key: 'additional_notes', label: 'Additional notes', area: true, full: true },
  { key: 'phone', label: 'Phone' },
  { key: 'email', label: 'Email' },
  { key: 'address', label: 'Address', full: true },
  { key: 'hours', label: 'Operating hours' },
]

export default function BusinessProfile() {
  const { id } = useParams()
  const location = useLocation() as { state?: { edit?: boolean } }
  const [profile, setProfile] = useState<BusinessProfile | null>(null)
  const [form, setForm] = useState<BusinessProfile | null>(null)
  const [edit, setEdit] = useState(Boolean(location.state?.edit))
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [err, setErr] = useState<string | null>(null)
  const [saved, setSaved] = useState(false)
  const [report, setReport] = useState<BiReport | null>(null)
  const [analysisLoading, setAnalysisLoading] = useState(false)
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null)

  async function fetchReport() {
    if (!id) return
    const { data } = await supabase
      .from('business_intelligence_reports' as any)
      .select('*')
      .eq('profile_id', id)
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle()
    if (data) {
      setReport(data as BiReport)
      if ((data as BiReport).status === 'processing' || (data as BiReport).status === 'pending') {
        setAnalysisLoading(true)
      }
    }
  }

  useEffect(() => {
    if (!id) return
    getProfile(id)
      .then((p) => { setProfile(p); setForm(p); if (p.status === 'onboarding') setEdit(true) })
      .catch((e) => setErr(e.message))
      .finally(() => setLoading(false))
    fetchReport()
  }, [id])

  useEffect(() => {
    if (!analysisLoading || !id) return
    pollRef.current = setInterval(async () => {
      const { data } = await supabase
        .from('business_intelligence_reports' as any)
        .select('*')
        .eq('profile_id', id)
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle()
      if (data) {
        const r = data as BiReport
        setReport(r)
        if (r.status === 'completed' || r.status === 'failed') {
          setAnalysisLoading(false)
          if (pollRef.current) clearInterval(pollRef.current)
        }
      }
    }, 3000)
    return () => { if (pollRef.current) clearInterval(pollRef.current) }
  }, [analysisLoading, id])

  function set<K extends FieldKey>(key: K, value: BusinessProfile[K]) {
    setForm((f) => (f ? { ...f, [key]: value } : f))
  }

  async function save() {
    if (!form || !id) return
    setSaving(true); setErr(null)
    try {
      const patch: Partial<BusinessProfile> = { ...form, status: form.status === 'onboarding' ? 'active' : form.status }
      delete (patch as any).id; delete (patch as any).created_at; delete (patch as any).updated_at
      const updated = await updateProfile(id, patch)
      setProfile(updated); setForm(updated); setEdit(false); setSaved(true)
      setTimeout(() => setSaved(false), 2500)
      // Trigger AI analysis in background
      setAnalysisLoading(true)
      setReport(null)
      fetch(N8N_WEBHOOK, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ profileId: id }),
      }).catch(() => {/* silent — webhook is fire-and-forget */})
    } catch (e: any) { setErr(e.message) } finally { setSaving(false) }
  }

  async function retryAnalysis() {
    if (!id) return
    setAnalysisLoading(true)
    setReport(null)
    fetch(N8N_WEBHOOK, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ profileId: id }),
    }).catch(() => {})
  }

  if (loading) return <LiquidCard lg><div style={{ color: 'var(--label-tertiary)' }}>Loading profile…</div></LiquidCard>
  if (!form) return <LiquidCard lg><div style={{ color: 'var(--red)' }}>{err || 'Profile not found'}</div></LiquidCard>

  return (
    <>
      {/* Back nav */}
      <div style={{ marginBottom: 16 }}>
        <Link to="/clients" className="btn-secondary" style={{ display: 'inline-flex', alignItems: 'center', gap: 4, color: 'var(--label-primary)' }}>
          <ChevronLeft size={16} /> Clients
        </Link>
      </div>

      {/* LinkedIn-style profile banner */}
      <div style={{ borderRadius: 20, overflow: 'hidden', marginBottom: 20, boxShadow: '0 8px 40px rgba(0,0,0,.35)' }}>

        {/* Cover strip */}
        <div style={{
          height: 110, position: 'relative', overflow: 'hidden',
          background: 'linear-gradient(135deg, #0b1f45 0%, #1a3a72 40%, #0e2d5c 70%, #071630 100%)',
        }}>
          {/* Subtle grid pattern overlay */}
          <svg width="100%" height="100%" style={{ position: 'absolute', inset: 0, opacity: .07 }} xmlns="http://www.w3.org/2000/svg">
            <defs>
              <pattern id="grid" width="28" height="28" patternUnits="userSpaceOnUse">
                <path d="M 28 0 L 0 0 0 28" fill="none" stroke="#fff" strokeWidth=".6"/>
              </pattern>
            </defs>
            <rect width="100%" height="100%" fill="url(#grid)" />
          </svg>
          {/* Radial glow */}
          <div style={{ position: 'absolute', top: -40, right: '15%', width: 240, height: 240,
            borderRadius: '50%', background: 'radial-gradient(circle, rgba(59,130,246,.28) 0%, transparent 70%)', pointerEvents: 'none' }} />
          <div style={{ position: 'absolute', bottom: -30, left: '30%', width: 160, height: 160,
            borderRadius: '50%', background: 'radial-gradient(circle, rgba(99,179,255,.15) 0%, transparent 70%)', pointerEvents: 'none' }} />
        </div>

        {/* Profile info row */}
        <div style={{
          background: 'var(--glass-fill)', backdropFilter: 'blur(40px) saturate(180%)',
          padding: '0 28px 22px', borderTop: '1px solid var(--separator)',
        }}>
          {/* Logo + actions row */}
          <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', marginBottom: 14 }}>
            {/* Logo pulled up over the cover */}
            <div style={{
              marginTop: -38, width: 76, height: 76, borderRadius: 18,
              background: '#fff', border: '3px solid var(--glass-fill)',
              boxShadow: '0 4px 20px rgba(0,0,0,.4)',
              display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, overflow: 'hidden',
            }}>
              <img
                src="https://victoryenergy.us/wp-content/uploads/2026/05/VE-Logo-Color.svg"
                alt="Victory Energy"
                style={{ width: 62, height: 62, objectFit: 'contain' }}
                onError={(e) => {
                  const el = e.currentTarget as HTMLImageElement
                  el.style.display = 'none'
                  const fb = document.createElement('span')
                  fb.textContent = (form.business_name || 'VE')[0]
                  fb.style.cssText = 'font-size:28px;font-weight:700;color:#0b1f45'
                  el.parentElement?.appendChild(fb)
                }}
              />
            </div>

            {/* Save / Edit buttons */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, paddingTop: 10 }}>
              {saved && <span className="badge badge-green">Saved</span>}
              {edit
                ? <button className="btn-primary" onClick={save} disabled={saving}>
                    <Check size={15} style={{ verticalAlign: -2, marginRight: 6 }} />
                    {saving ? 'Saving…' : 'Save Business Profile'}
                  </button>
                : <button className="btn-secondary" style={{ color: 'var(--label-primary)' }} onClick={() => setEdit(true)}>
                    <Pencil size={14} style={{ verticalAlign: -2, marginRight: 6 }} />Edit
                  </button>}
            </div>
          </div>

          {/* Name + tagline */}
          <h1 style={{ fontFamily: 'var(--font-display)', fontSize: 26, fontWeight: 700, margin: '0 0 4px', letterSpacing: '-.01em' }}>
            {form.business_name}
          </h1>
          {form.tagline && (
            <div style={{ fontSize: 14.5, color: 'var(--label-secondary)', marginBottom: 10, fontStyle: 'italic' }}>
              "{form.tagline}"
            </div>
          )}

          {/* Badges row */}
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'center', marginBottom: 16 }}>
            <span className={`badge ${form.status === 'active' ? 'badge-green' : 'badge-orange'}`}>{form.status}</span>
            {form.industry && <span className="badge badge-blue">{form.industry}</span>}
            <span style={{ fontSize: 12, color: 'var(--label-tertiary)' }}>Business Discovery Form · editable anytime</span>
          </div>

          {/* Stats strip */}
          <div style={{
            display: 'flex', gap: 0, borderRadius: 12, overflow: 'hidden',
            border: '1px solid var(--separator)', background: 'var(--fill-quaternary)',
          }}>
            {[
              { label: 'Service states', value: form.service_areas.length || '—' },
              { label: 'Platforms', value: form.target_platforms.length || '—' },
              { label: 'Website', value: form.website_url ? 'Linked' : '—' },
              { label: 'Status', value: form.status.charAt(0).toUpperCase() + form.status.slice(1) },
            ].map((s, i) => (
              <div key={s.label} style={{
                flex: 1, padding: '12px 16px', textAlign: 'center',
                borderLeft: i > 0 ? '1px solid var(--separator)' : 'none',
              }}>
                <div style={{ fontSize: 20, fontWeight: 700, letterSpacing: '-.02em', color: 'var(--label-primary)' }}>{s.value}</div>
                <div style={{ fontSize: 11, color: 'var(--label-tertiary)', textTransform: 'uppercase', letterSpacing: '.04em', marginTop: 2 }}>{s.label}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {err && <LiquidCard style={{ marginBottom: 16, color: 'var(--red)' }}>{err}</LiquidCard>}

      <LiquidCard lg style={{ marginBottom: 16 }}>
        <div style={{ fontSize: 12, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '.02em', color: 'var(--label-tertiary)', marginBottom: 10 }}>Target platforms</div>
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          {Object.keys(platformMeta).map((p) => {
            const on = form.target_platforms.includes(p)
            return (
              <button key={p} disabled={!edit}
                onClick={() => set('target_platforms', on ? form.target_platforms.filter((x) => x !== p) : [...form.target_platforms, p])}
                style={{ border: 'none', cursor: edit ? 'pointer' : 'default', padding: '7px 12px', borderRadius: 9, fontSize: 13, fontWeight: 600,
                  background: on ? platformMeta[p].color : 'var(--fill-tertiary)', color: on ? '#fff' : 'var(--label-secondary)', opacity: !edit && !on ? 0.45 : 1 }}>
                {platformMeta[p].label}
              </button>
            )
          })}
        </div>
        <div style={{ fontSize: 12, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '.02em', color: 'var(--label-tertiary)', margin: '18px 0 8px' }}>Service areas (states)</div>
        {edit
          ? <input className="input" value={form.service_areas.join(', ')} placeholder="CA, TX, FL…"
              onChange={(e) => set('service_areas', e.target.value.split(',').map((s) => s.trim().toUpperCase()).filter(Boolean))} />
          : <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
              {form.service_areas.length ? form.service_areas.map((s) => <span key={s} className="badge badge-grey">{s}</span>) : <span style={{ color: 'var(--label-tertiary)' }}>—</span>}
            </div>}
      </LiquidCard>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(320px,1fr))', gap: 16 }}>
        {sections.map((f) => (
          <LiquidCard key={f.key as string} style={f.full ? { gridColumn: '1 / -1' } : undefined}>
            <div style={{ fontSize: 12, fontWeight: 600, letterSpacing: '.02em', textTransform: 'uppercase', color: 'var(--label-tertiary)', marginBottom: 8 }}>{f.label}</div>
            {edit
              ? (f.area
                  ? <textarea className="input" rows={3} value={(form[f.key] as string) ?? ''} onChange={(e) => set(f.key, e.target.value as any)} />
                  : <input className="input" value={(form[f.key] as string) ?? ''} onChange={(e) => set(f.key, e.target.value as any)} />)
              : <div style={{ color: 'var(--label-primary)' }}>{renderValue(f.key, (form[f.key] as string) ?? '')}</div>}
          </LiquidCard>
        ))}

        {/* Assets upload — full-width drag-drop, rendered separately from generic sections */}
        <LiquidCard style={{ gridColumn: '1 / -1' }}>
          <div style={{ fontSize: 12, fontWeight: 600, letterSpacing: '.02em', textTransform: 'uppercase', color: 'var(--label-tertiary)', marginBottom: 8 }}>Assets upload</div>
          <AssetUploader
            profileId={id!}
            value={form.assets ?? ''}
            onChange={(json) => set('assets', json as any)}
            disabled={!edit}
          />
        </LiquidCard>
      </div>

      {/* ── AI Business Intelligence Report ── */}
      <LiquidCard lg style={{ marginTop: 20 }}>
        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{
              width: 36, height: 36, borderRadius: 10,
              background: 'linear-gradient(135deg, #3b82f6 0%, #8b5cf6 100%)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
              <Brain size={18} color="#fff" />
            </div>
            <div>
              <div style={{ fontWeight: 700, fontSize: 16, color: 'var(--label-primary)' }}>AI Business Intelligence Report</div>
              <div style={{ fontSize: 12, color: 'var(--label-tertiary)' }}>Auto-generated when you save the profile</div>
            </div>
          </div>
          {report?.status === 'completed' && (
            <button className="btn-secondary" style={{ color: 'var(--label-secondary)', fontSize: 12 }} onClick={retryAnalysis}>
              <RefreshCw size={13} style={{ marginRight: 5 }} />Re-run
            </button>
          )}
          {report?.status === 'failed' && (
            <button className="btn-secondary" style={{ color: 'var(--red)', fontSize: 12 }} onClick={retryAnalysis}>
              <RefreshCw size={13} style={{ marginRight: 5 }} />Retry
            </button>
          )}
        </div>

        {/* Loading state */}
        {analysisLoading && (
          <div style={{
            display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
            padding: '48px 24px', gap: 16, textAlign: 'center',
          }}>
            <div style={{ position: 'relative', width: 64, height: 64 }}>
              <div style={{
                position: 'absolute', inset: 0, borderRadius: '50%',
                background: 'linear-gradient(135deg, rgba(59,130,246,.25), rgba(139,92,246,.25))',
                animation: 'pulse 2s ease-in-out infinite',
              }} />
              <div style={{
                position: 'absolute', inset: 8, borderRadius: '50%',
                background: 'linear-gradient(135deg, #3b82f6, #8b5cf6)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}>
                <Loader2 size={22} color="#fff" style={{ animation: 'spin 1s linear infinite' }} />
              </div>
            </div>
            <div>
              <div style={{ fontWeight: 600, fontSize: 15, color: 'var(--label-primary)', marginBottom: 6 }}>
                Generating Business Intelligence Report…
              </div>
              <div style={{ fontSize: 13, color: 'var(--label-tertiary)', maxWidth: 380 }}>
                Scraping website & social media, researching competitors, analyzing SEO opportunities, and synthesizing insights with GPT-4o. This takes ~60 seconds.
              </div>
            </div>
            {/* Animated progress steps */}
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', justifyContent: 'center', marginTop: 8 }}>
              {['Website', 'Instagram', 'Facebook', 'LinkedIn', 'Competitors', 'SEO', 'Synthesis'].map((step, i) => (
                <div key={step} style={{
                  padding: '4px 10px', borderRadius: 20, fontSize: 11.5, fontWeight: 500,
                  background: 'var(--fill-quaternary)', color: 'var(--label-secondary)',
                  border: '1px solid var(--separator)',
                  animation: `fadeInUp 0.4s ease ${i * 0.15}s both`,
                }}>
                  {step}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Error state */}
        {!analysisLoading && report?.status === 'failed' && (
          <div style={{
            display: 'flex', alignItems: 'center', gap: 12, padding: '16px 18px',
            borderRadius: 12, background: 'rgba(239,68,68,.08)', border: '1px solid rgba(239,68,68,.2)',
          }}>
            <AlertCircle size={20} color="var(--red)" />
            <div>
              <div style={{ fontWeight: 600, fontSize: 14, color: 'var(--red)' }}>Analysis failed</div>
              <div style={{ fontSize: 13, color: 'var(--label-tertiary)', marginTop: 2 }}>{report.error_message || 'An error occurred. Click Retry to try again.'}</div>
            </div>
          </div>
        )}

        {/* Empty state (no report yet) */}
        {!analysisLoading && !report && (
          <div style={{ textAlign: 'center', padding: '36px 24px', color: 'var(--label-tertiary)' }}>
            <Brain size={36} style={{ opacity: .25, marginBottom: 12 }} />
            <div style={{ fontSize: 14 }}>Save the profile to auto-generate your Business Intelligence Report.</div>
          </div>
        )}

        {/* Completed report */}
        {!analysisLoading && report?.status === 'completed' && report.full_report && (
          <>
            <div style={{
              display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 16,
            }}>
              {[
                { label: 'Website', field: report.website_analysis },
                { label: 'Instagram', field: report.instagram_analysis },
                { label: 'Facebook', field: report.facebook_analysis },
                { label: 'LinkedIn', field: report.linkedin_analysis },
                { label: 'Competitors', field: report.competitor_analysis },
                { label: 'SEO', field: report.seo_analysis },
                { label: 'Audience', field: report.audience_analysis },
              ].map(({ label, field }) => (
                <span key={label} className="badge" style={{
                  background: field ? 'rgba(59,130,246,.12)' : 'var(--fill-quaternary)',
                  color: field ? 'var(--blue)' : 'var(--label-tertiary)',
                  border: `1px solid ${field ? 'rgba(59,130,246,.25)' : 'var(--separator)'}`,
                }}>{label} {field ? '✓' : '—'}</span>
              ))}
              <span style={{ fontSize: 11.5, color: 'var(--label-tertiary)', alignSelf: 'center', marginLeft: 4 }}>
                Generated {new Date(report.updated_at).toLocaleDateString(undefined, { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
              </span>
            </div>
            <div style={{
              borderRadius: 12, background: 'var(--fill-quaternary)', padding: '20px 24px',
              border: '1px solid var(--separator)', maxHeight: 600, overflowY: 'auto',
            }}>
              {renderMarkdown(report.full_report)}
            </div>
          </>
        )}
      </LiquidCard>

      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
        @keyframes pulse { 0%,100% { transform: scale(1); opacity:.6; } 50% { transform: scale(1.12); opacity:1; } }
        @keyframes fadeInUp { from { opacity:0; transform:translateY(6px); } to { opacity:1; transform:translateY(0); } }
      `}</style>
    </>
  )
}
