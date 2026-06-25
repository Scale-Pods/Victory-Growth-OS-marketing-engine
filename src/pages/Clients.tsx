import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { ArrowRight, Plus, X } from 'lucide-react'
import { LiquidCard, PageHeader } from '../components/ui'
import { listProfiles, createProfile, type BusinessProfile } from '../lib/clients'

export default function Clients() {
  const nav = useNavigate()
  const [rows, setRows] = useState<BusinessProfile[]>([])
  const [loading, setLoading] = useState(true)
  const [creating, setCreating] = useState(false)
  const [name, setName] = useState('')
  const [industry, setIndustry] = useState('')
  const [busy, setBusy] = useState(false)
  const [err, setErr] = useState<string | null>(null)

  useEffect(() => {
    listProfiles().then(setRows).catch((e) => setErr(e.message)).finally(() => setLoading(false))
  }, [])

  async function submit(e: React.FormEvent) {
    e.preventDefault()
    if (!name.trim()) return
    setBusy(true); setErr(null)
    try {
      const created = await createProfile({ business_name: name.trim(), industry: industry.trim() || null, status: 'onboarding' })
      nav(`/clients/${created.id}`, { state: { edit: true } })
    } catch (e: any) { setErr(e.message); setBusy(false) }
  }

  return (
    <>
      <PageHeader title="Clients" subtitle="Business profiles & onboarding"
        action={<button className="btn-primary" onClick={() => setCreating((v) => !v)}>{creating ? 'Close' : 'Create new client'}</button>} />

      {creating && (
        <LiquidCard lg style={{ marginBottom: 16 }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
            <h2 style={{ fontSize: 17, fontWeight: 600 }}>New client</h2>
            <button className="btn-secondary" style={{ width: 32, height: 32, padding: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--label-primary)' }} onClick={() => setCreating(false)}><X size={16} /></button>
          </div>
          <form onSubmit={submit} style={{ display: 'grid', gridTemplateColumns: '1fr 1fr auto', gap: 12, alignItems: 'end' }}>
            <div>
              <label style={{ fontSize: 12, color: 'var(--label-tertiary)', textTransform: 'uppercase', letterSpacing: '.02em' }}>Business name</label>
              <input className="input" style={{ marginTop: 6 }} value={name} onChange={(e) => setName(e.target.value)} placeholder="Acme Solar" autoFocus />
            </div>
            <div>
              <label style={{ fontSize: 12, color: 'var(--label-tertiary)', textTransform: 'uppercase', letterSpacing: '.02em' }}>Industry</label>
              <input className="input" style={{ marginTop: 6 }} value={industry} onChange={(e) => setIndustry(e.target.value)} placeholder="Residential Solar" />
            </div>
            <button className="btn-primary" type="submit" disabled={busy} style={{ height: 42, display: 'flex', alignItems: 'center', gap: 6, opacity: busy ? 0.7 : 1 }}>
              <Plus size={15} />{busy ? 'Creating…' : 'Create & open form'}
            </button>
          </form>
          {err && <div style={{ color: 'var(--red)', fontSize: 13, marginTop: 10 }}>{err}</div>}
        </LiquidCard>
      )}

      {loading ? (
        <LiquidCard lg><div style={{ color: 'var(--label-tertiary)' }}>Loading clients…</div></LiquidCard>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(280px,1fr))', gap: 16 }}>
          {rows.map((c) => (
            <div key={c.id} onClick={() => nav(`/clients/${c.id}`)} style={{ cursor: 'default' }}>
              <LiquidCard lg hover>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 14 }}>
                  <div style={{ width: 44, height: 44, borderRadius: 12, background: 'var(--fill-tertiary)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, fontSize: 15 }}>{c.business_name[0]}</div>
                  <div style={{ minWidth: 0 }}>
                    <div style={{ fontSize: 16, fontWeight: 600 }}>{c.business_name}</div>
                    <div style={{ fontSize: 12.5, color: 'var(--label-secondary)' }}>{c.industry || '—'}</div>
                  </div>
                  <ArrowRight size={18} style={{ marginLeft: 'auto', color: 'var(--label-tertiary)' }} />
                </div>
                <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
                  <span className={`badge ${c.status === 'active' ? 'badge-green' : 'badge-orange'}`}>{c.status}</span>
                  <span className="badge badge-grey">{c.target_platforms.length} platforms</span>
                  {c.service_areas.length > 0 && <span className="badge badge-blue">{c.service_areas.length} states</span>}
                </div>
              </LiquidCard>
            </div>
          ))}
          {rows.length === 0 && <LiquidCard lg><div style={{ color: 'var(--label-tertiary)' }}>No clients yet — create one above.</div></LiquidCard>}
        </div>
      )}
    </>
  )
}
