import { useEffect, useRef, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import {
  ChevronLeft, Brain, Loader2, RefreshCw, AlertCircle,
  Globe, Instagram, Facebook, Linkedin, Users, Search, TrendingUp, FileText,
} from 'lucide-react'
import { LiquidCard } from '../components/ui'
import { supabase } from '../lib/supabase'
import { getProfile, type BusinessProfile } from '../lib/clients'

const N8N_WEBHOOK = 'https://n8n.srv1010832.hstgr.cloud/webhook/ai-analysis'

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

const TABS = [
  { key: 'full_report', label: 'Full Report', icon: FileText, color: '#8b5cf6' },
  { key: 'website_analysis', label: 'Website', icon: Globe, color: '#3b82f6' },
  { key: 'instagram_analysis', label: 'Instagram', icon: Instagram, color: '#e1306c' },
  { key: 'facebook_analysis', label: 'Facebook', icon: Facebook, color: '#1877f2' },
  { key: 'linkedin_analysis', label: 'LinkedIn', icon: Linkedin, color: '#0a66c2' },
  { key: 'competitor_analysis', label: 'Competitors', icon: TrendingUp, color: '#f59e0b' },
  { key: 'seo_analysis', label: 'SEO', icon: Search, color: '#10b981' },
  { key: 'audience_analysis', label: 'Audience', icon: Users, color: '#ec4899' },
] as const

type TabKey = typeof TABS[number]['key']

function renderMarkdown(text: string) {
  return text.split('\n').map((line, i) => {
    if (line.startsWith('# '))
      return <h2 key={i} style={{ fontSize: 22, fontWeight: 700, margin: '22px 0 8px', color: 'var(--label-primary)', letterSpacing: '-.02em' }}>{line.slice(2)}</h2>
    if (line.startsWith('## '))
      return <h3 key={i} style={{ fontSize: 17, fontWeight: 600, margin: '18px 0 6px', color: 'var(--label-primary)' }}>{line.slice(3)}</h3>
    if (line.startsWith('### '))
      return <h4 key={i} style={{ fontSize: 14, fontWeight: 600, margin: '14px 0 4px', color: 'var(--label-secondary)', textTransform: 'uppercase', letterSpacing: '.04em' }}>{line.slice(4)}</h4>
    if (line.startsWith('- ') || line.startsWith('* '))
      return <li key={i} style={{ fontSize: 14.5, lineHeight: 1.7, color: 'var(--label-primary)', marginLeft: 20, marginBottom: 4 }}>{line.slice(2)}</li>
    if (line.trim() === '')
      return <br key={i} />
    return <p key={i} style={{ fontSize: 14.5, lineHeight: 1.7, color: 'var(--label-primary)', margin: '4px 0' }}>{line}</p>
  })
}

export default function IntelligenceReport() {
  const { id } = useParams()
  const [profile, setProfile] = useState<BusinessProfile | null>(null)
  const [report, setReport] = useState<BiReport | null>(null)
  const [loading, setLoading] = useState(true)
  const [analysisLoading, setAnalysisLoading] = useState(false)
  const [activeTab, setActiveTab] = useState<TabKey>('full_report')
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null)

  useEffect(() => {
    if (!id) return
    Promise.all([getProfile(id), fetchReport(id)]).finally(() => setLoading(false))
  }, [id])

  useEffect(() => {
    if (!analysisLoading || !id) return
    pollRef.current = setInterval(async () => {
      const r = await fetchReport(id)
      if (r && (r.status === 'completed' || r.status === 'failed')) {
        setAnalysisLoading(false)
        if (pollRef.current) clearInterval(pollRef.current)
      }
    }, 3000)
    return () => { if (pollRef.current) clearInterval(pollRef.current) }
  }, [analysisLoading, id])

  async function fetchReport(profileId: string): Promise<BiReport | null> {
    const { data } = await supabase
      .from('business_intelligence_reports' as any)
      .select('*')
      .eq('profile_id', profileId)
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle()
    if (data) {
      const r = data as BiReport
      setReport(r)
      if (r.status === 'processing' || r.status === 'pending') setAnalysisLoading(true)
      return r
    }
    return null
  }

  async function runAnalysis() {
    if (!id) return
    setAnalysisLoading(true)
    setReport(null)
    fetch(N8N_WEBHOOK, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ profileId: id }),
    }).catch(() => {})
  }

  async function loadProfile() {
    if (!id) return
    try { setProfile(await getProfile(id)) } catch { /* noop */ }
  }

  useEffect(() => { loadProfile() }, [id])

  if (loading) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: 360, gap: 12, color: 'var(--label-tertiary)' }}>
        <Loader2 size={20} style={{ animation: 'spin 1s linear infinite' }} /> Loading…
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      </div>
    )
  }

  const completedTabs = report?.status === 'completed'
    ? TABS.filter((t) => report[t.key])
    : []

  return (
    <>
      {/* Back nav */}
      <div style={{ marginBottom: 16 }}>
        <Link to="/intelligence" className="btn-secondary" style={{ display: 'inline-flex', alignItems: 'center', gap: 4, color: 'var(--label-primary)', textDecoration: 'none' }}>
          <ChevronLeft size={16} /> Business Intelligence
        </Link>
      </div>

      {/* Page header */}
      <div style={{
        borderRadius: 20, overflow: 'hidden', marginBottom: 20,
        boxShadow: '0 8px 40px rgba(0,0,0,.3)',
      }}>
        {/* Cover */}
        <div style={{
          height: 90, position: 'relative', overflow: 'hidden',
          background: 'linear-gradient(135deg, #1e1b4b 0%, #312e81 40%, #4c1d95 70%, #2d1b69 100%)',
        }}>
          <svg width="100%" height="100%" style={{ position: 'absolute', inset: 0, opacity: .06 }} xmlns="http://www.w3.org/2000/svg">
            <defs><pattern id="dots" width="20" height="20" patternUnits="userSpaceOnUse">
              <circle cx="2" cy="2" r="1.2" fill="#fff" />
            </pattern></defs>
            <rect width="100%" height="100%" fill="url(#dots)" />
          </svg>
          <div style={{ position: 'absolute', top: -30, right: '10%', width: 200, height: 200, borderRadius: '50%', background: 'radial-gradient(circle, rgba(139,92,246,.3) 0%, transparent 70%)', pointerEvents: 'none' }} />
        </div>

        {/* Info row */}
        <div style={{ background: 'var(--glass-fill)', backdropFilter: 'blur(40px) saturate(180%)', padding: '0 28px 20px', borderTop: '1px solid var(--separator)' }}>
          <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', marginBottom: 12 }}>
            {/* Brain icon */}
            <div style={{
              marginTop: -28, width: 56, height: 56, borderRadius: 14,
              background: 'linear-gradient(135deg, #3b82f6, #8b5cf6)',
              border: '3px solid var(--glass-fill)',
              boxShadow: '0 4px 20px rgba(0,0,0,.4)',
              display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
            }}>
              <Brain size={24} color="#fff" />
            </div>
            <div style={{ display: 'flex', gap: 8, paddingTop: 8 }}>
              {report?.status === 'completed' && (
                <button className="btn-secondary" style={{ fontSize: 12.5, color: 'var(--label-secondary)' }} onClick={runAnalysis}>
                  <RefreshCw size={13} style={{ marginRight: 5 }} />Re-run Analysis
                </button>
              )}
              {(!report || report.status === 'failed') && !analysisLoading && (
                <button className="btn-primary" style={{ fontSize: 12.5 }} onClick={runAnalysis}>
                  <Brain size={13} style={{ marginRight: 5 }} />Run Analysis
                </button>
              )}
            </div>
          </div>
          <h1 style={{ fontFamily: 'var(--font-display)', fontSize: 22, fontWeight: 700, margin: '0 0 3px', letterSpacing: '-.02em' }}>
            {profile?.business_name ?? 'Business Intelligence Report'}
          </h1>
          <div style={{ fontSize: 13, color: 'var(--label-tertiary)', marginBottom: 12 }}>
            {profile?.industry && <span>{profile.industry}</span>}
            {profile?.industry && report?.updated_at && <span style={{ margin: '0 8px' }}>·</span>}
            {report?.updated_at && (
              <span>Last generated {new Date(report.updated_at).toLocaleDateString(undefined, { month: 'long', day: 'numeric', year: 'numeric', hour: '2-digit', minute: '2-digit' })}</span>
            )}
          </div>
        </div>
      </div>

      {/* Loading state */}
      {analysisLoading && (
        <LiquidCard lg style={{ marginBottom: 20 }}>
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '40px 24px', gap: 16, textAlign: 'center' }}>
            <div style={{ position: 'relative', width: 64, height: 64 }}>
              <div style={{ position: 'absolute', inset: 0, borderRadius: '50%', background: 'linear-gradient(135deg, rgba(59,130,246,.2), rgba(139,92,246,.2))', animation: 'pulse 2s ease-in-out infinite' }} />
              <div style={{ position: 'absolute', inset: 8, borderRadius: '50%', background: 'linear-gradient(135deg, #3b82f6, #8b5cf6)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Loader2 size={22} color="#fff" style={{ animation: 'spin 1s linear infinite' }} />
              </div>
            </div>
            <div>
              <div style={{ fontWeight: 600, fontSize: 16, color: 'var(--label-primary)', marginBottom: 6 }}>Generating Business Intelligence Report…</div>
              <div style={{ fontSize: 13.5, color: 'var(--label-tertiary)', maxWidth: 420 }}>Scraping website & social media, researching competitors, analyzing SEO opportunities — synthesizing with GPT-4o. Takes ~60s.</div>
            </div>
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', justifyContent: 'center' }}>
              {['Website', 'Instagram', 'Facebook', 'LinkedIn', 'Competitors', 'SEO', 'Audience', 'Synthesis'].map((step, i) => (
                <div key={step} style={{ padding: '4px 12px', borderRadius: 20, fontSize: 12, fontWeight: 500, background: 'var(--fill-quaternary)', color: 'var(--label-secondary)', border: '1px solid var(--separator)', animation: `fadeInUp .4s ease ${i * .12}s both` }}>
                  {step}
                </div>
              ))}
            </div>
          </div>
        </LiquidCard>
      )}

      {/* Error */}
      {!analysisLoading && report?.status === 'failed' && (
        <LiquidCard style={{ marginBottom: 20 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <AlertCircle size={20} color="var(--red)" />
            <div>
              <div style={{ fontWeight: 600, fontSize: 14, color: 'var(--red)' }}>Analysis failed</div>
              <div style={{ fontSize: 13, color: 'var(--label-tertiary)', marginTop: 2 }}>{report.error_message || 'An error occurred. Click Re-run Analysis to try again.'}</div>
            </div>
          </div>
        </LiquidCard>
      )}

      {/* No report yet */}
      {!analysisLoading && !report && (
        <LiquidCard lg style={{ textAlign: 'center', padding: '48px 24px' }}>
          <Brain size={44} style={{ opacity: .18, marginBottom: 16 }} />
          <div style={{ fontSize: 15.5, fontWeight: 600, color: 'var(--label-primary)', marginBottom: 8 }}>No report generated yet</div>
          <div style={{ fontSize: 13.5, color: 'var(--label-tertiary)', marginBottom: 20 }}>Click "Run Analysis" to generate a full Business Intelligence Report for this client.</div>
          <button className="btn-primary" onClick={runAnalysis} style={{ margin: '0 auto' }}>
            <Brain size={15} style={{ marginRight: 7 }} />Run Analysis
          </button>
        </LiquidCard>
      )}

      {/* Completed report */}
      {!analysisLoading && report?.status === 'completed' && (
        <>
          {/* Tab strip */}
          <div style={{
            display: 'flex', gap: 4, overflowX: 'auto', padding: '4px 0', marginBottom: 16,
            scrollbarWidth: 'none',
          }}>
            {TABS.map((tab) => {
              const Icon = tab.icon
              const isActive = activeTab === tab.key
              const hasData = Boolean(report[tab.key])
              return (
                <button
                  key={tab.key}
                  onClick={() => setActiveTab(tab.key)}
                  disabled={!hasData}
                  style={{
                    display: 'flex', alignItems: 'center', gap: 6, flexShrink: 0,
                    padding: '8px 14px', borderRadius: 10, border: 'none', cursor: hasData ? 'pointer' : 'not-allowed',
                    fontSize: 13, fontWeight: isActive ? 600 : 500,
                    background: isActive ? tab.color : 'var(--fill-secondary)',
                    color: isActive ? '#fff' : hasData ? 'var(--label-primary)' : 'var(--label-quaternary)',
                    opacity: !hasData ? 0.4 : 1,
                    transition: 'all .15s ease',
                    boxShadow: isActive ? `0 4px 14px ${tab.color}44` : 'none',
                  }}
                >
                  <Icon size={14} strokeWidth={2} />
                  {tab.label}
                </button>
              )
            })}
          </div>

          {/* Active tab content */}
          {TABS.map((tab) => {
            if (activeTab !== tab.key) return null
            const content = report[tab.key]
            if (!content) return (
              <LiquidCard key={tab.key} style={{ color: 'var(--label-tertiary)', textAlign: 'center', padding: '32px 24px' }}>
                No {tab.label.toLowerCase()} data available.
              </LiquidCard>
            )
            return (
              <LiquidCard key={tab.key} lg>
                {/* Tab header */}
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 20, paddingBottom: 16, borderBottom: '1px solid var(--separator)' }}>
                  <div style={{
                    width: 32, height: 32, borderRadius: 8, flexShrink: 0,
                    background: `${tab.color}20`,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                  }}>
                    <tab.icon size={16} color={tab.color} />
                  </div>
                  <div style={{ fontWeight: 600, fontSize: 16, color: 'var(--label-primary)' }}>{tab.label} Analysis</div>
                  {completedTabs.length > 0 && (
                    <div style={{ marginLeft: 'auto', fontSize: 12, color: 'var(--label-tertiary)' }}>
                      {completedTabs.findIndex((t) => t.key === tab.key) + 1} of {completedTabs.length} sections
                    </div>
                  )}
                </div>
                {/* Content */}
                <div style={{ maxHeight: tab.key === 'full_report' ? 'none' : 500, overflowY: tab.key === 'full_report' ? 'visible' : 'auto' }}>
                  {renderMarkdown(content)}
                </div>
              </LiquidCard>
            )
          })}
        </>
      )}

      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
        @keyframes pulse { 0%,100% { transform: scale(1); opacity:.6; } 50% { transform: scale(1.1); opacity:1; } }
        @keyframes fadeInUp { from { opacity:0; transform:translateY(6px); } to { opacity:1; transform:translateY(0); } }
        ::-webkit-scrollbar { display: none; }
      `}</style>
    </>
  )
}
