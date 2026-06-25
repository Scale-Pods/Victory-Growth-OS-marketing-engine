import { supabase } from './supabase'
import type { Post } from '../data/dummy'

function ago(iso: string | null): string {
  if (!iso) return ''
  const diff = Date.now() - new Date(iso).getTime()
  const m = Math.round(diff / 60000)
  if (m < 1) return 'just now'
  if (m < 60) return `${m}m ago`
  const h = Math.round(m / 60)
  if (h < 24) return `${h}h ago`
  return `${Math.round(h / 24)}d ago`
}

const knownPlatforms = ['tiktok', 'linkedin', 'youtube', 'instagram', 'facebook']

// Pulls live rows from scheduled_posts and maps them to the Post UI shape.
export async function fetchScheduledPosts(): Promise<Post[]> {
  const { data, error } = await supabase
    .from('scheduled_posts')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(50)
  if (error) throw error
  return (data ?? []).map((r) => ({
    id: r.id,
    title: r.caption || 'Untitled post',
    platform: (knownPlatforms.includes(r.platform) ? r.platform : 'tiktok') as Post['platform'],
    status: (r.status as Post['status']) ?? 'draft',
    when: r.published_at ? ago(r.published_at) : r.scheduled_time ? new Date(r.scheduled_time).toLocaleString() : ago(r.created_at),
    via: r.buffer_post_id ? 'Buffer' : undefined,
  }))
}
