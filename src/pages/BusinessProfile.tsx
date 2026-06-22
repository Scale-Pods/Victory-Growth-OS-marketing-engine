import { useState } from 'react'
import { Link } from 'react-router-dom'
import { ChevronLeft, Pencil, Check } from 'lucide-react'
import { LiquidCard } from '../components/ui'
import { businessProfile, platformMeta } from '../data/dummy'

const fields: { key: keyof typeof businessProfile; label: string; long?: boolean }[] = [
  { key: 'business_name', label: 'Business name' },
  { key: 'industry', label: 'Industry' },
  { key: 'description', label: 'Description', long: true },
  { key: 'products_services', label: 'Products & services', long: true },
  { key: 'target_audience', label: 'Target audience', long: true },
  { key: 'business_goals', label: 'Business goals', long: true },
  { key: 'brand_guidelines', label: 'Brand guidelines' },
  { key: 'brand_voice', label: 'Brand voice' },
  { key: 'competitors', label: 'Competitors' },
  { key: 'website_url', label: 'Website URL' },
  { key: 'social_media_urls', label: 'Social media URLs', long: true },
  { key: 'additional_notes', label: 'Additional notes', long: true },
]

export default function BusinessProfile() {
  const [edit, setEdit] = useState(false)
  const [form, setForm] = useState({ ...businessProfile })

  return (
    <>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 20 }}>
        <Link to="/clients" className="btn-secondary" style={{ display: 'flex', alignItems: 'center', gap: 4, color: 'var(--label-primary)' }}><ChevronLeft size={16} /> Clients</Link>
        <div>
          <h1 style={{ fontFamily: 'var(--font-display)', fontSize: 28, fontWeight: 700 }}>{form.business_name}</h1>
          <div style={{ fontSize: 13, color: 'var(--label-secondary)' }}>Business profile · editable anytime</div>
        </div>
        <div style={{ flex: 1 }} />
        {edit
          ? <button className="btn-primary" onClick={() => setEdit(false)}><Check size={15} style={{ verticalAlign: -2, marginRight: 6 }} />Save</button>
          : <button className="btn-secondary" style={{ color: 'var(--label-primary)' }} onClick={() => setEdit(true)}><Pencil size={14} style={{ verticalAlign: -2, marginRight: 6 }} />Edit</button>}
      </div>

      <LiquidCard lg style={{ marginBottom: 16 }}>
        <div style={{ fontSize: 13, fontWeight: 500, color: 'var(--label-secondary)', marginBottom: 10 }}>Target platforms</div>
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          {Object.keys(platformMeta).map((p) => {
            const on = form.target_platforms.includes(p)
            return (
              <button key={p} disabled={!edit}
                onClick={() => setForm((f) => ({ ...f, target_platforms: on ? f.target_platforms.filter((x) => x !== p) : [...f.target_platforms, p] }))}
                style={{ border: 'none', cursor: edit ? 'pointer' : 'default', padding: '7px 12px', borderRadius: 9, fontSize: 13, fontWeight: 600,
                  background: on ? platformMeta[p].color : 'var(--fill-tertiary)', color: on ? '#fff' : 'var(--label-secondary)', opacity: !edit && !on ? .5 : 1 }}>
                {platformMeta[p].label}
              </button>
            )
          })}
        </div>
      </LiquidCard>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(320px,1fr))', gap: 16 }}>
        {fields.map((f) => (
          <LiquidCard key={f.key} style={{ gridColumn: f.long ? 'span 1' : undefined }}>
            <div style={{ fontSize: 12, fontWeight: 600, letterSpacing: '.02em', textTransform: 'uppercase', color: 'var(--label-tertiary)', marginBottom: 8 }}>{f.label}</div>
            {edit
              ? (f.long
                  ? <textarea className="input" rows={3} value={form[f.key] as string} onChange={(e) => setForm((s) => ({ ...s, [f.key]: e.target.value }))} />
                  : <input className="input" value={form[f.key] as string} onChange={(e) => setForm((s) => ({ ...s, [f.key]: e.target.value }))} />)
              : <div style={{ fontSize: 14.5, lineHeight: 1.47, color: 'var(--label-primary)' }}>{form[f.key] as string}</div>}
          </LiquidCard>
        ))}
      </div>
    </>
  )
}
