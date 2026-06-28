import { supabase } from './supabase'

export const N8N_CONTENT_TEXT_WEBHOOK = 'https://n8n.srv1010832.hstgr.cloud/webhook/content-factory-text'

export type ContentType =
  | 'static_image' | 'carousel' | 'ugc_video' | 'motion_graphics' | 'product_video'
  | 'blog' | 'social_caption' | 'linkedin_article' | 'website_content' | 'email'

export type ContentItemStatus = 'pending' | 'generating' | 'ready' | 'in_review' | 'approved' | 'revision' | 'failed'
export type ContentRunStatus = 'pending' | 'processing' | 'completed' | 'failed' | 'partial'

export type ContentRun = {
  id: string
  profile_id: string
  strategy_id: string | null
  status: ContentRunStatus
  total_items: number
  completed_items: number
  ai_summary: string | null
  created_at: string
  updated_at: string
}

export type ContentItemMeta = {
  hashtags?: string[]
  cta?: string
  keywords?: string[]
  seo_notes?: string
  topic?: string
  hook?: string
}

export type ContentItem = {
  id: string
  run_id: string | null
  profile_id: string
  strategy_id: string | null
  calendar_index: number | null
  content_type: ContentType
  status: ContentItemStatus
  platform: string | null
  scheduled_date: string | null
  title: string | null
  body: string | null
  media_url: string | null
  thumbnail_url: string | null
  metadata: ContentItemMeta
  review_notes: string | null
  revision_count: number
  approved_at: string | null
  created_at: string
  updated_at: string
}

// Display metadata per content type
export const CONTENT_TYPE_META: Record<ContentType, { label: string; color: string; kind: 'text' | 'image' | 'video' }> = {
  social_caption:   { label: 'Social Caption',   color: '#3b82f6', kind: 'text' },
  blog:             { label: 'Blog',             color: '#8b5cf6', kind: 'text' },
  linkedin_article: { label: 'LinkedIn Article', color: '#0a66c2', kind: 'text' },
  website_content:  { label: 'Website Content',  color: '#10b981', kind: 'text' },
  email:            { label: 'Email',            color: '#f59e0b', kind: 'text' },
  static_image:     { label: 'Static Image',     color: '#ec4899', kind: 'image' },
  carousel:         { label: 'Carousel',         color: '#e1306c', kind: 'image' },
  ugc_video:        { label: 'UGC Video',        color: '#ef4444', kind: 'video' },
  motion_graphics:  { label: 'Motion Graphics',  color: '#06b6d4', kind: 'video' },
  product_video:    { label: 'Product Video',    color: '#14b8a6', kind: 'video' },
}

export const ALL_CONTENT_TYPES = Object.keys(CONTENT_TYPE_META) as ContentType[]

/** Latest content run for a profile. */
export async function getLatestContentRun(profileId: string): Promise<ContentRun | null> {
  const { data } = await supabase
    .from('content_runs' as any)
    .select('*')
    .eq('profile_id', profileId)
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle()
  return (data as ContentRun) ?? null
}

/** All content items for a run, in calendar order. */
export async function getContentItems(runId: string): Promise<ContentItem[]> {
  const { data } = await supabase
    .from('content_items' as any)
    .select('*')
    .eq('run_id', runId)
    .order('calendar_index', { ascending: true, nullsFirst: false })
  return (data as ContentItem[]) ?? []
}

/** Fire the n8n Content Factory text engine for one client. */
export async function triggerContentTextRun(profileId: string): Promise<void> {
  await fetch(N8N_CONTENT_TEXT_WEBHOOK, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ profileId }),
  }).catch(() => {})
}

/** Update a single content item (e.g. approve / request revision / edit body). */
export async function updateContentItem(id: string, patch: Partial<ContentItem>): Promise<void> {
  await supabase.from('content_items' as any).update(patch).eq('id', id)
}
