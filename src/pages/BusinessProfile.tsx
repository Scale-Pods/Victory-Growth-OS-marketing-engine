import { useEffect, useState } from 'react'
import { Link, useParams, useLocation } from 'react-router-dom'
import { ChevronLeft, Pencil, Check, ExternalLink } from 'lucide-react'
import { LiquidCard } from '../components/ui'
import AssetUploader from '../components/AssetUploader'
import { platformMeta } from '../data/dummy'
import { getProfile, updateProfile, type BusinessProfile } from '../lib/clients'

const URL_RE = /https?:\/\/[^\s]+/g

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

  useEffect(() => {
    if (!id) return
    getProfile(id)
      .then((p) => { setProfile(p); setForm(p); if (p.status === 'onboarding') setEdit(true) })
      .catch((e) => setErr(e.message))
      .finally(() => setLoading(false))
  }, [id])

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
    } catch (e: any) { setErr(e.message) } finally { setSaving(false) }
  }

  if (loading) return <LiquidCard lg><div style={{ color: 'var(--label-tertiary)' }}>Loading profile…</div></LiquidCard>
  if (!form) return <LiquidCard lg><div style={{ color: 'var(--red)' }}>{err || 'Profile not found'}</div></LiquidCard>

  return (
    <>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 20 }}>
        <Link to="/clients" className="btn-secondary" style={{ display: 'flex', alignItems: 'center', gap: 4, color: 'var(--label-primary)' }}><ChevronLeft size={16} /> Clients</Link>
        <div>
          <h1 style={{ fontFamily: 'var(--font-display)', fontSize: 28, fontWeight: 700 }}>{form.business_name}</h1>
          <div style={{ fontSize: 13, color: 'var(--label-secondary)', display: 'flex', alignItems: 'center', gap: 8 }}>
            <span className={`badge ${form.status === 'active' ? 'badge-green' : 'badge-orange'}`}>{form.status}</span>
            Business Discovery Form · editable anytime
          </div>
        </div>
        <div style={{ flex: 1 }} />
        {saved && <span className="badge badge-green">Saved</span>}
        {edit
          ? <button className="btn-primary" onClick={save} disabled={saving}><Check size={15} style={{ verticalAlign: -2, marginRight: 6 }} />{saving ? 'Saving…' : 'Save Business Profile'}</button>
          : <button className="btn-secondary" style={{ color: 'var(--label-primary)' }} onClick={() => setEdit(true)}><Pencil size={14} style={{ verticalAlign: -2, marginRight: 6 }} />Edit</button>}
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
    </>
  )
}
