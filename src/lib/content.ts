import { supabase } from './supabase'

export const N8N_CONTENT_TEXT_WEBHOOK = 'https://n8n.srv1010832.hstgr.cloud/webhook/content-factory-text'
export const N8N_CONTENT_IMAGE_WEBHOOK = 'https://n8n.srv1010832.hstgr.cloud/webhook/content-factory-image'
export const N8N_CONTENT_BRAND_WEBHOOK = 'https://n8n.srv1010832.hstgr.cloud/webhook/content-factory-brand'
export const N8N_CONTENT_REGEN_WEBHOOK = 'https://n8n.srv1010832.hstgr.cloud/webhook/content-regenerate'

/**
 * SAFE / DEMO MODE — master switch for ALL n8n generation webhooks.
 *
 * While `false`, the front end SHOWCASES already-generated content but will NOT
 * fire any workflow even if a button is clicked — so there is zero risk of an
 * accidental fal.ai / HeyGen / OpenAI spend. Flip to `true` only when the UI
 * is meant to trigger live generation. (n8n video/UGC workflows also have no
 * fal/HeyGen credentials attached, as a second safety layer.)
 */
export const GENERATION_ENABLED = false

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
  slides?: string[] // carousel slide image URLs (multi-slide)
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

/** Fire the n8n Content Factory text engine for one client. No-op while GENERATION_ENABLED is false. */
export async function triggerContentTextRun(profileId: string): Promise<void> {
  if (!GENERATION_ENABLED) return
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

/** Approve a content item (Creative Review). */
export async function approveContentItem(id: string): Promise<void> {
  await supabase.from('content_items' as any)
    .update({ status: 'approved', approved_at: new Date().toISOString() })
    .eq('id', id)
}

/** Request a revision: flag the item and fire the regenerate workflow with notes. */
export async function requestRevision(id: string, notes: string, currentCount: number): Promise<void> {
  await supabase.from('content_items' as any)
    .update({ status: 'revision', review_notes: notes, revision_count: (currentCount ?? 0) + 1 })
    .eq('id', id)
  if (!GENERATION_ENABLED) return
  await fetch(N8N_CONTENT_REGEN_WEBHOOK, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ itemId: id, notes }),
  }).catch(() => {})
}

/** Manually replace an item's image with an uploaded file. Returns the new URL. */
export async function uploadContentImage(id: string, file: File): Promise<string | null> {
  const path = `items/${id}-manual-${Date.now()}.png`
  const { error } = await supabase.storage.from('content-media').upload(path, file, { upsert: true, contentType: file.type })
  if (error) return null
  const url = supabase.storage.from('content-media').getPublicUrl(path).data.publicUrl
  await supabase.from('content_items' as any).update({ media_url: url, status: 'ready' }).eq('id', id)
  return url
}

// ───────────────────────── Designer Workspace ─────────────────────────
// These designer asset operations (local upload, Figma/Canva import) pull the
// designer's OWN content and cost nothing — so they are NOT gated by
// GENERATION_ENABLED (only AI generation is).

const SUPA_FN = 'https://jjtdbbdzidycgdzjkvvf.supabase.co/functions/v1'
export const CANVA_CONNECT_URL = `${SUPA_FN}/canva-oauth-start?key=designer-default`
const CANVA_LIST_URL = `${SUPA_FN}/canva-list-designs?key=designer-default`
const CANVA_IMPORT_URL = `${SUPA_FN}/canva-import`
const FIGMA_IMPORT_URL = `${SUPA_FN}/figma-import`

export type Role = 'admin' | 'client' | 'designer'
export function getRole(): Role {
  const r = (localStorage.getItem('ve_role') || 'admin').toLowerCase()
  return r === 'designer' || r === 'client' ? (r as Role) : 'admin'
}
export function setRole(r: Role) { localStorage.setItem('ve_role', r) }

export type CanvaDesign = {
  id: string; title: string | null; thumbnail: string | null
  edit_url: string | null; view_url: string | null; updated_at: number
}

/** List the connected designer's Canva designs (or {connected:false} to prompt OAuth). */
export async function listCanvaDesigns(): Promise<{ connected: boolean; designs: CanvaDesign[] }> {
  try {
    const res = await fetch(CANVA_LIST_URL)
    const data = await res.json()
    return { connected: !!data.connected, designs: (data.designs as CanvaDesign[]) ?? [] }
  } catch { return { connected: false, designs: [] } }
}

/** Export a Canva design and attach it to the item. Returns the new media URL. */
export async function importCanvaDesign(itemId: string, designId: string, format: 'png' | 'mp4' = 'png'): Promise<string | null> {
  try {
    const res = await fetch(CANVA_IMPORT_URL, {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ itemId, designId, format }),
    })
    const data = await res.json()
    return data.ok ? (data.media_url as string) : null
  } catch { return null }
}

/** Export a Figma frame (via edge function) and attach it to the item. Returns the new media URL. */
export async function importFigmaFrame(itemId: string, figmaUrl: string): Promise<string | null> {
  try {
    const res = await fetch(FIGMA_IMPORT_URL, {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ itemId, figmaUrl }),
    })
    const data = await res.json()
    return data.ok ? (data.media_url as string) : null
  } catch { return null }
}

/** Upload any media (image OR video) from the designer's computer. */
export async function uploadContentMedia(id: string, file: File): Promise<string | null> {
  const ext = file.name.split('.').pop()?.toLowerCase() || (file.type.startsWith('video') ? 'mp4' : 'png')
  const path = `items/${id}-upload-${Date.now()}.${ext}`
  const { error } = await supabase.storage.from('content-media').upload(path, file, { upsert: true, contentType: file.type })
  if (error) return null
  const url = supabase.storage.from('content-media').getPublicUrl(path).data.publicUrl + '?v=' + Date.now()
  await supabase.from('content_items' as any).update({ media_url: url, status: 'in_review' }).eq('id', id)
  return url
}

/** Designer submits an item for admin/client approval. */
export async function submitForApproval(id: string): Promise<void> {
  await supabase.from('content_items' as any).update({ status: 'in_review' }).eq('id', id)
}

/** Admin/client rejects a submitted item back to the designer. */
export async function rejectContentItem(id: string, notes?: string): Promise<void> {
  await supabase.from('content_items' as any).update({ status: 'ready', review_notes: notes ?? null }).eq('id', id)
}

/** Save an edited (cropped/filtered) image blob from the editor → new media URL. */
export async function uploadEditedMedia(id: string, blob: Blob, tag = 'edit'): Promise<string | null> {
  const path = `items/${id}-${tag}-${Date.now()}.png`
  const { error } = await supabase.storage.from('content-media').upload(path, blob, { upsert: true, contentType: 'image/png' })
  if (error) return null
  const url = supabase.storage.from('content-media').getPublicUrl(path).data.publicUrl + '?v=' + Date.now()
  await supabase.from('content_items' as any).update({ media_url: url, status: 'in_review' }).eq('id', id)
  return url
}
