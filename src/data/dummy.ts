export const platformMeta: Record<string, { label: string; color: string; abbr: string }> = {
  tiktok: { label: 'TikTok', color: '#ff375f', abbr: 'TT' },
  linkedin: { label: 'LinkedIn', color: '#0a84ff', abbr: 'in' },
  youtube: { label: 'YouTube', color: '#ff453a', abbr: 'YT' },
  instagram: { label: 'Instagram', color: '#bf5af2', abbr: 'IG' },
  facebook: { label: 'Facebook', color: '#5e5ce6', abbr: 'fb' },
}

export const kpis = [
  { label: 'Published', value: '6', trend: '+3 this week', dir: 'up', accent: 'var(--green)' },
  { label: 'Scheduled', value: '3', trend: 'next 48h', dir: 'up', accent: 'var(--blue)' },
  { label: 'Platforms live', value: '5', trend: 'TikTok · LI · YT · +2', dir: 'flat', accent: 'var(--purple)' },
  { label: 'Trending topics', value: '18', trend: 'solar incentives', dir: 'up', accent: 'var(--orange)' },
]

export type Post = {
  id: string; title: string; platform: keyof typeof platformMeta;
  status: 'published' | 'scheduled' | 'draft' | 'failed'; when: string; via?: string
}

export const posts: Post[] = [
  { id: 'p1', title: 'ScalePods Test Short', platform: 'youtube', status: 'published', when: '2m ago' },
  { id: 'p2', title: 'Hello LinkedIn 👋', platform: 'linkedin', status: 'published', when: '1h ago' },
  { id: 'p3', title: 'Solar savings in 30s', platform: 'tiktok', status: 'scheduled', when: 'Tomorrow 18:00', via: 'Buffer' },
  { id: 'p4', title: 'Install reel draft', platform: 'instagram', status: 'draft', when: 'Needs review' },
  { id: 'p5', title: 'Floating solar PV', platform: 'tiktok', status: 'published', when: 'Yesterday', via: 'Publer' },
  { id: 'p6', title: 'Why net metering matters', platform: 'linkedin', status: 'scheduled', when: 'Tue 09:00' },
  { id: 'p7', title: 'Follow-up math nobody talks about', platform: 'youtube', status: 'published', when: '3d ago' },
  { id: 'p8', title: 'Q3 incentive deadline', platform: 'facebook', status: 'failed', when: 'Token expired' },
]

export type CalItem = { platform: keyof typeof platformMeta; title: string }
export const calendar: { day: string; items: CalItem[] }[] = [
  { day: 'Mon', items: [{ platform: 'tiktok', title: 'Floating solar PV' }] },
  { day: 'Tue', items: [{ platform: 'linkedin', title: 'Why net metering matters' }] },
  { day: 'Wed', items: [{ platform: 'youtube', title: 'Follow-up math' }, { platform: 'tiktok', title: '30-day savings' }] },
  { day: 'Thu', items: [{ platform: 'instagram', title: 'Install reel' }] },
  { day: 'Fri', items: [{ platform: 'linkedin', title: 'Q3 incentives' }] },
  { day: 'Sat', items: [] },
  { day: 'Sun', items: [{ platform: 'youtube', title: 'Customer story' }] },
]

export const platforms = [
  { key: 'tiktok', name: 'TikTok', handle: '@victoryenergy · Buffer + Publer', live: true },
  { key: 'linkedin', name: 'LinkedIn', handle: 'OAuth · 60-day token', live: true },
  { key: 'youtube', name: 'YouTube', handle: 'Resumable upload · Data API v3', live: true },
  { key: 'facebook', name: 'Buffer / Publer', handle: 'Cross-post scheduler', live: true },
  { key: 'instagram', name: 'Instagram', handle: 'Not connected', live: false },
]

export const trends = [
  { topic: '30% federal solar tax credit', platform: 'linkedin', score: 94, delta: '+18%', tag: 'Incentives' },
  { topic: 'Floating solar farms', platform: 'tiktok', score: 88, delta: '+31%', tag: 'Tech' },
  { topic: 'Net metering changes 2026', platform: 'youtube', score: 81, delta: '+12%', tag: 'Policy' },
  { topic: 'Battery backup vs grid', platform: 'tiktok', score: 76, delta: '+9%', tag: 'Education' },
  { topic: 'Solar payback period', platform: 'instagram', score: 72, delta: '+6%', tag: 'Finance' },
  { topic: 'Heat pump + solar combo', platform: 'linkedin', score: 68, delta: '+22%', tag: 'Tech' },
]

export const clients = [
  { id: 'victory-energy', name: 'Victory Energy', industry: 'Residential Solar', platforms: 5, status: 'Active', posts: 42 },
  { id: 'sunpath', name: 'SunPath Renewables', industry: 'Commercial Solar', platforms: 3, status: 'Onboarding', posts: 0 },
  { id: 'brightroof', name: 'BrightRoof Co', industry: 'Roofing + Solar', platforms: 2, status: 'Active', posts: 17 },
]

export const businessProfile = {
  business_name: 'Victory Energy',
  industry: 'Residential & light-commercial solar',
  description: 'Driven by Integrity. Built for Performance. Full EPC solar provider operating across 19 US states.',
  products_services: 'Site surveys, EPC installation, post-install service, permitting & interconnection.',
  target_audience: 'Homeowners (25–65), 19 states, $60k+ household income, high electric bills.',
  business_goals: 'Scale online lead gen, build inside-sales pipeline, increase appointment conversion.',
  brand_guidelines: 'Primary blue #4374B9 · clean, trustworthy, performance-driven.',
  brand_voice: 'Confident, clear, reassuring. Emphasize savings, speed, trust.',
  target_platforms: ['tiktok', 'linkedin', 'youtube', 'instagram', 'facebook'],
  competitors: 'Local D2D solar installers, national EPC firms.',
  website_url: 'https://victoryenergy.us',
  social_media_urls: 'instagram.com/victoryenergyofficial · linkedin.com/company/victory-energy-us',
  additional_notes: 'Rebrand live June 2026. Lead intake currently via single Support form.',
}

export const engagementSeries = [
  { name: 'Mon', impressions: 4200, engagement: 320 },
  { name: 'Tue', impressions: 5100, engagement: 410 },
  { name: 'Wed', impressions: 8200, engagement: 690 },
  { name: 'Thu', impressions: 6100, engagement: 480 },
  { name: 'Fri', impressions: 7400, engagement: 560 },
  { name: 'Sat', impressions: 3200, engagement: 210 },
  { name: 'Sun', impressions: 5600, engagement: 450 },
]

export const platformPerf = [
  { name: 'TikTok', value: 38 },
  { name: 'LinkedIn', value: 27 },
  { name: 'YouTube', value: 21 },
  { name: 'Instagram', value: 14 },
]
