import { supabase } from './supabase'

export const N8N_STRATEGY_WEBHOOK = 'https://n8n.srv1010832.hstgr.cloud/webhook/marketing-strategy'

export type StrategyStatus = 'pending' | 'processing' | 'completed' | 'failed' | 'approved'

// The 7 generated components. Typed loosely where GPT output can vary in shape.
export type Campaign = { name: string; objective?: string; duration?: string; channels?: string[]; kpis?: string[]; description?: string }
export type CampaignPlanning = { campaigns?: Campaign[] }

export type WeekPlan = { week?: string | number; theme?: string; focus?: string; post_count?: string | number; goals?: string }
export type WeeklyContentStrategy = { weeks?: WeekPlan[] }

export type ContentPillar = { pillar: string; description?: string; example_topics?: string[]; target_percentage?: string | number }

export type CalendarPost = { date?: string; platform?: string; content_type?: string; topic?: string; hook?: string; cta?: string }

export type PlatformPlan = { platform: string; priority?: string; posting_frequency?: string; content_focus?: string; best_times?: string; notes?: string }

export type LeadGenTactic = { name: string; channel?: string; description?: string; expected_outcome?: string }
export type LeadGenerationStrategy = { tactics?: LeadGenTactic[]; lead_magnets?: string[]; funnel_stages?: string[] }

export type Cta = { cta: string; use_case?: string; placement?: string }
export type CtaStrategy = { primary_ctas?: Cta[]; secondary_ctas?: string[] }

export type MarketingStrategy = {
  id: string
  profile_id: string
  status: StrategyStatus
  ai_summary: string | null
  campaign_planning: CampaignPlanning | null
  weekly_content_strategy: WeeklyContentStrategy | null
  content_pillars: ContentPillar[] | null
  content_calendar: CalendarPost[] | null
  platform_strategy: PlatformPlan[] | null
  lead_generation_strategy: LeadGenerationStrategy | null
  cta_strategy: CtaStrategy | null
  error_message: string | null
  approved_at: string | null
  created_at: string
  updated_at: string
}

/** Latest strategy for a profile (or null if none yet). */
export async function getLatestStrategy(profileId: string): Promise<MarketingStrategy | null> {
  const { data } = await supabase
    .from('marketing_strategies' as any)
    .select('*')
    .eq('profile_id', profileId)
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle()
  return (data as MarketingStrategy) ?? null
}

/** Fire the n8n Marketing Strategy Engine for one client (fire-and-forget). */
export async function triggerStrategyRun(profileId: string): Promise<void> {
  await fetch(N8N_STRATEGY_WEBHOOK, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ profileId }),
  }).catch(() => {})
}

/** Approve a generated strategy (locks it in). */
export async function approveStrategy(strategyId: string): Promise<void> {
  await supabase
    .from('marketing_strategies' as any)
    .update({ status: 'approved', approved_at: new Date().toISOString() })
    .eq('id', strategyId)
}
