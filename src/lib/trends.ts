import { supabase } from './supabase'

export const N8N_TREND_WEBHOOK = 'https://n8n.srv1010832.hstgr.cloud/webhook/trend-engine'

export type TrendSource =
  | 'google_trends' | 'google_news' | 'reddit' | 'tiktok'
  | 'instagram' | 'youtube' | 'linkedin' | 'seo_keywords' | 'competitor_campaigns'

export type TrendRunStatus = 'pending' | 'processing' | 'completed' | 'failed' | 'partial'

export type TrendRun = {
  id: string
  profile_id: string
  status: TrendRunStatus
  sources_completed: string[]
  sources_failed: string[]
  total_signals: number
  ai_summary: string | null
  error_message: string | null
  created_at: string
  updated_at: string
}

export type TrendSignal = {
  id: string
  run_id: string
  profile_id: string
  source: TrendSource
  topic: string
  description: string | null
  url: string | null
  raw_score: number | null
  raw_metric_label: string | null
  relevance_score: number | null
  relevance_reason: string | null
  thumbnail_url: string | null
  metadata: Record<string, unknown>
  captured_at: string
}

// Display metadata for each of the 9 sources
export const SOURCE_META: Record<TrendSource, { label: string; color: string; icon: string }> = {
  google_trends:        { label: 'Google Trends',   color: '#4285f4', icon: 'trending' },
  google_news:          { label: 'Google News',     color: '#ea4335', icon: 'news' },
  reddit:               { label: 'Reddit',          color: '#ff4500', icon: 'reddit' },
  tiktok:               { label: 'TikTok',          color: '#000000', icon: 'tiktok' },
  instagram:            { label: 'Instagram',       color: '#e1306c', icon: 'instagram' },
  youtube:              { label: 'YouTube',         color: '#ff0000', icon: 'youtube' },
  linkedin:             { label: 'LinkedIn',        color: '#0a66c2', icon: 'linkedin' },
  seo_keywords:         { label: 'SEO Keywords',    color: '#10b981', icon: 'search' },
  competitor_campaigns: { label: 'Competitor Ads',  color: '#f59e0b', icon: 'target' },
}

export const ALL_SOURCES = Object.keys(SOURCE_META) as TrendSource[]

/** Latest run for a profile (or null if none yet). */
export async function getLatestRun(profileId: string): Promise<TrendRun | null> {
  const { data } = await supabase
    .from('trend_runs' as any)
    .select('*')
    .eq('profile_id', profileId)
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle()
  return (data as TrendRun) ?? null
}

/** All signals for a given run, ranked by relevance. */
export async function getSignals(runId: string): Promise<TrendSignal[]> {
  const { data } = await supabase
    .from('trend_signals' as any)
    .select('*')
    .eq('run_id', runId)
    .order('relevance_score', { ascending: false, nullsFirst: false })
  return (data as TrendSignal[]) ?? []
}

/** Fire the n8n Trend Engine for one client (fire-and-forget). */
export async function triggerTrendRun(profileId: string): Promise<void> {
  await fetch(N8N_TREND_WEBHOOK, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ profileId }),
  }).catch(() => {})
}
