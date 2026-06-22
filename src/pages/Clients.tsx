import { Link } from 'react-router-dom'
import { ArrowRight } from 'lucide-react'
import { LiquidCard, PageHeader } from '../components/ui'
import { clients } from '../data/dummy'

export default function Clients() {
  return (
    <>
      <PageHeader title="Clients" subtitle="Business profiles & onboarding" action={<button className="btn-primary">Create new client</button>} />
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(280px,1fr))', gap: 16 }}>
        {clients.map((c) => (
          <Link key={c.id} to={`/clients/${c.id}`} style={{ textDecoration: 'none', color: 'inherit' }}>
            <LiquidCard lg hover>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 14 }}>
                <div style={{ width: 44, height: 44, borderRadius: 12, background: 'var(--fill-tertiary)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, fontSize: 15 }}>{c.name[0]}</div>
                <div>
                  <div style={{ fontSize: 16, fontWeight: 600 }}>{c.name}</div>
                  <div style={{ fontSize: 12.5, color: 'var(--label-secondary)' }}>{c.industry}</div>
                </div>
                <ArrowRight size={18} style={{ marginLeft: 'auto', color: 'var(--label-tertiary)' }} />
              </div>
              <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                <span className={`badge ${c.status === 'Active' ? 'badge-green' : 'badge-orange'}`}>{c.status}</span>
                <span className="badge badge-grey">{c.platforms} platforms</span>
                <span className="badge badge-blue">{c.posts} posts</span>
              </div>
            </LiquidCard>
          </Link>
        ))}
      </div>
    </>
  )
}
