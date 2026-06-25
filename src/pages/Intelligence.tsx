import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { Brain, Loader2, CheckCircle2, AlertCircle, Clock, ChevronRight, RefreshCw, ExternalLink } from 'lucide-react'
import { LiquidCard } from '../components/ui'
import { supabase } from '../lib/supabase'
import { listProfiles, type BusinessProfile } from '../lib/clients'

type BiReport = {
  id: string
  profile_id: string
  status: 'pending' | 'processing' | 'completed' | 'failed'
  full_report: string | null
  updated_at: string
  created_at: string
}

type ClientWithReport = BusinessProfile & { report: BiReport | null }

const STATUS_META = {
  completed: { label: 'Report ready', color: 'var(--green)', bg: 'rgba(52,199,89,.12)', icon: CheckCircle2 },
  processing: { label: 'Analyzing…', color: '#f59e0b', bg: 'rgba(245,158,11,.12)', icon: Loader2 },
  pending: { label: 'Queued', color: '#f59e0b', bg: 'rgba(245,158,11,.12)', icon: Clock },
  failed: { label: 'Failed', color: 'var(--red)', bg: 'rgba(239,68,68,.12)', icon: AlertCircle },
  none: { label: 'No report', color: 'var(--label-tertiary)', bg: 'var(--fill-quaternary)', icon: Clock },
}

export default function Intelligence() {
  const [clients, setClients] = useState<ClientWithReport[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    load()
  }, [])

  async function load() {
    setLoading(true)
    try {
      const profiles = await listProfiles()
      const { data: reports } = await supabase
        .from('business_intelligence_reports' as any)
        .select('id, profile_id, status, full_report, updated_at, created_at')
        .order('created_at', { ascending: false })

      const reportMap = new Map<string, BiReport>()
      if (reports) {
        for (const r of reports as BiReport[]) {
          if (!reportMap.has(r.profile_id)) reportMap.set(r.profile_id, r)
        }
      }

      setClients(profiles.map((p) => ({ ...p, report: reportMap.get(p.id) ?? null })))
    } finally {
      setLoading(false)
    }
  }

  const completedCount = clients.filter((c) => c.report?.status === 'completed').length
  const processingCount = clients.filter((c) => c.report?.status === 'processing' || c.report?.status === 'pending').length

  if (loading) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: 300, gap: 12, color: 'var(--label-tertiary)' }}>
        <Loader2 size={20} style={{ animation: 'spin 1s linear infinite' }} />
        Loading intelligence reports…
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      </div>
    )
  }

  return (
    <>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 24 }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 6 }}>
            <div style={{
              width: 44, height: 44, borderRadius: 12,
              background: 'linear-gradient(135deg, #3b82f6 0%, #8b5cf6 100%)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
              <Brain size={22} color="#fff" />
            </div>
            <div>
              <h1 style={{ fontFamily: 'var(--font-display)', fontSize: 26, fontWeight: 700, margin: 0, letterSpacing: '-.02em' }}>
                Business Intelligence
              </h1>
              <div style={{ fontSize: 13.5, color: 'var(--label-tertiary)', marginTop: 2 }}>
                AI-powered analysis of your clients' digital presence
              </div>
            </div>
          </div>
        </div>
        <button className="btn-secondary" onClick={load} style={{ color: 'var(--label-secondary)', marginTop: 4 }}>
          <RefreshCw size={14} style={{ marginRight: 6 }} />Refresh
        </button>
      </div>

      {/* Stats strip */}
      <div style={{ display: 'flex', gap: 12, marginBottom: 28 }}>
        {[
          { label: 'Total clients', value: clients.length, color: 'var(--label-primary)' },
          { label: 'Reports ready', value: completedCount, color: 'var(--green)' },
          { label: 'In progress', value: processingCount, color: '#f59e0b' },
        ].map((s) => (
          <LiquidCard key={s.label} style={{ flex: 1, padding: '14px 18px' }}>
            <div style={{ fontSize: 28, fontWeight: 700, color: s.color, letterSpacing: '-.03em', lineHeight: 1 }}>{s.value}</div>
            <div style={{ fontSize: 12, color: 'var(--label-tertiary)', textTransform: 'uppercase', letterSpacing: '.04em', marginTop: 4 }}>{s.label}</div>
          </LiquidCard>
        ))}
      </div>

      {/* Client cards */}
      {clients.length === 0 ? (
        <LiquidCard lg style={{ textAlign: 'center', padding: '48px 24px', color: 'var(--label-tertiary)' }}>
          <Brain size={40} style={{ opacity: .2, marginBottom: 12 }} />
          <div style={{ fontSize: 15 }}>No client profiles yet. Add a client to generate their first report.</div>
        </LiquidCard>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(340px, 1fr))', gap: 16 }}>
          {clients.map((client) => {
            const status = (client.report?.status ?? 'none') as keyof typeof STATUS_META
            const meta = STATUS_META[status]
            const StatusIcon = meta.icon
            const isProcessing = status === 'processing' || status === 'pending'

            return (
              <LiquidCard key={client.id} style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
                {/* Card header */}
                <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 14 }}>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontWeight: 700, fontSize: 16, color: 'var(--label-primary)', marginBottom: 3, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {client.business_name}
                    </div>
                    <div style={{ fontSize: 12.5, color: 'var(--label-tertiary)' }}>
                      {client.industry || 'No industry set'}
                      {client.service_areas?.length ? ` · ${client.service_areas.slice(0, 3).join(', ')}${client.service_areas.length > 3 ? '…' : ''}` : ''}
                    </div>
                  </div>
                  {/* Status badge */}
                  <div style={{
                    display: 'flex', alignItems: 'center', gap: 5,
                    padding: '4px 10px', borderRadius: 20, fontSize: 12, fontWeight: 500,
                    background: meta.bg, color: meta.color, flexShrink: 0, marginLeft: 10,
                  }}>
                    <StatusIcon size={12} style={isProcessing ? { animation: 'spin 1s linear infinite' } : undefined} />
                    {meta.label}
                  </div>
                </div>

                {/* Report preview */}
                {client.report?.status === 'completed' && client.report.full_report && (
                  <div style={{
                    fontSize: 13, color: 'var(--label-secondary)', lineHeight: 1.55,
                    background: 'var(--fill-quaternary)', borderRadius: 10,
                    padding: '10px 12px', marginBottom: 14,
                    display: '-webkit-box', WebkitLineClamp: 3, WebkitBoxOrient: 'vertical', overflow: 'hidden',
                  }}>
                    {client.report.full_report.replace(/^#+\s.+$/gm, '').replace(/\*\*/g, '').trim().slice(0, 220)}…
                  </div>
                )}

                {isProcessing && (
                  <div style={{
                    fontSize: 12.5, color: '#f59e0b', lineHeight: 1.5,
                    background: 'rgba(245,158,11,.08)', borderRadius: 10,
                    padding: '10px 12px', marginBottom: 14, border: '1px solid rgba(245,158,11,.2)',
                  }}>
                    Scraping website, social media, and running GPT-4o analysis…
                  </div>
                )}

                {status === 'none' && (
                  <div style={{
                    fontSize: 12.5, color: 'var(--label-tertiary)', lineHeight: 1.5,
                    background: 'var(--fill-quaternary)', borderRadius: 10,
                    padding: '10px 12px', marginBottom: 14,
                  }}>
                    Save the business profile to auto-generate a report.
                  </div>
                )}

                {/* Footer */}
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: 'auto', paddingTop: 4 }}>
                  {client.report?.updated_at ? (
                    <span style={{ fontSize: 11.5, color: 'var(--label-tertiary)' }}>
                      {status === 'completed' ? 'Generated' : 'Updated'} {new Date(client.report.updated_at).toLocaleDateString(undefined, { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                    </span>
                  ) : <span />}
                  <div style={{ display: 'flex', gap: 8 }}>
                    <Link to={`/clients/${client.id}`} style={{ fontSize: 12.5, color: 'var(--label-tertiary)', textDecoration: 'none', display: 'flex', alignItems: 'center', gap: 4 }}>
                      Profile <ExternalLink size={11} />
                    </Link>
                    {client.report?.status === 'completed' && (
                      <Link
                        to={`/intelligence/${client.id}`}
                        className="btn-primary"
                        style={{ fontSize: 12.5, padding: '5px 12px', display: 'flex', alignItems: 'center', gap: 5, textDecoration: 'none' }}
                      >
                        View Report <ChevronRight size={13} />
                      </Link>
                    )}
                  </div>
                </div>
              </LiquidCard>
            )
          })}
        </div>
      )}

      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </>
  )
}
