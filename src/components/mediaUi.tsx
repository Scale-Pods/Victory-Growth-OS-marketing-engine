import { useState } from 'react'
import { ChevronLeft, ChevronRight } from 'lucide-react'

// ───────────────────────── Platform badge (real logos + brand colors) ─────────────────────────

const IG_GRADIENT = 'linear-gradient(45deg,#feda75 0%,#fa7e1e 25%,#d62976 50%,#962fbf 75%,#4f5bd5 100%)'

function IgGlyph() {
  return (
    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" aria-hidden>
      <rect x="2" y="2" width="20" height="20" rx="6" stroke="#fff" strokeWidth="2" />
      <circle cx="12" cy="12" r="4.4" stroke="#fff" strokeWidth="2" />
      <circle cx="17.6" cy="6.4" r="1.4" fill="#fff" />
    </svg>
  )
}
function FbGlyph() {
  return (
    <svg width="12" height="12" viewBox="0 0 24 24" fill="#fff" aria-hidden>
      <path d="M13.5 21v-7.9h2.7l.4-3.1h-3.1V8c0-.9.25-1.5 1.55-1.5H17V3.7c-.3 0-1.3-.12-2.45-.12-2.42 0-4.05 1.48-4.05 4.2v2.32H8v3.1h2.5V21z" />
    </svg>
  )
}
function LiGlyph() {
  return (
    <svg width="12" height="12" viewBox="0 0 24 24" fill="#fff" aria-hidden>
      <path d="M6.94 5a1.94 1.94 0 11-3.88 0 1.94 1.94 0 013.88 0zM3.4 8.4h3.1V21H3.4zM9.1 8.4h2.97v1.72h.04c.41-.78 1.42-1.6 2.93-1.6 3.13 0 3.71 2.06 3.71 4.74V21h-3.1v-5.4c0-1.29-.02-2.95-1.8-2.95-1.8 0-2.07 1.4-2.07 2.85V21H9.1z" />
    </svg>
  )
}
function YtGlyph() {
  return (
    <svg width="13" height="13" viewBox="0 0 24 24" fill="#fff" aria-hidden>
      <path d="M21.6 7.2s-.2-1.4-.8-2c-.75-.8-1.6-.8-2-.85C16 4.2 12 4.2 12 4.2h0s-4 0-6.8.15c-.4.05-1.25.05-2 .85-.6.6-.8 2-.8 2S2.2 8.8 2.2 10.5v1.6c0 1.7.2 3.3.2 3.3s.2 1.4.8 2c.75.8 1.75.75 2.2.85 1.6.15 6.6.15 6.6.15s4 0 6.8-.15c.4-.05 1.25-.05 2-.85.6-.6.8-2 .8-2s.2-1.6.2-3.3v-1.6c0-1.7-.2-3.3-.2-3.3zM9.9 14.4V8.9l5.15 2.75z" />
    </svg>
  )
}

type PlatformStyle = { bg: string; label: string; glyph?: JSX.Element }
function platformStyle(platform?: string | null): PlatformStyle {
  const p = (platform || '').toLowerCase()
  if (p.includes('instagram') || p === 'ig') return { bg: IG_GRADIENT, label: 'Instagram', glyph: <IgGlyph /> }
  if (p.includes('facebook') || p === 'fb') return { bg: '#1877F2', label: 'Facebook', glyph: <FbGlyph /> }
  if (p.includes('linkedin')) return { bg: '#0A66C2', label: 'LinkedIn', glyph: <LiGlyph /> }
  if (p.includes('youtube')) return { bg: '#FF0000', label: 'YouTube', glyph: <YtGlyph /> }
  if (p.includes('tiktok')) return { bg: '#000', label: 'TikTok' }
  if (p.includes('twitter') || p === 'x') return { bg: '#000', label: 'X' }
  return { bg: 'var(--fill-tertiary)', label: platform || '—' }
}

export function PlatformBadge({ platform, size = 'md' }: { platform?: string | null; size?: 'sm' | 'md' }) {
  const s = platformStyle(platform)
  const neutral = s.bg.startsWith('var(')
  const pad = size === 'sm' ? '2px 8px' : '3px 9px'
  const fs = size === 'sm' ? 10.5 : 11.5
  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center', gap: 5, padding: pad, borderRadius: 20,
      background: s.bg, color: neutral ? 'var(--label-secondary)' : '#fff',
      fontSize: fs, fontWeight: 600, lineHeight: 1, whiteSpace: 'nowrap',
    }}>
      {s.glyph}{s.label}
    </span>
  )
}

// ───────────────────────── Carousel viewer (multi-slide) ─────────────────────────

export function CarouselViewer({ slides, aspect = '1 / 1' }: { slides: string[]; aspect?: string }) {
  const [i, setI] = useState(0)
  const n = slides.length
  const go = (d: number) => setI((prev) => (prev + d + n) % n)
  return (
    <div style={{ position: 'relative', marginBottom: 12 }}>
      <img src={slides[i]} alt={`Slide ${i + 1}`} loading="lazy"
        style={{ width: '100%', aspectRatio: aspect, objectFit: 'cover', borderRadius: 10, background: 'var(--fill-tertiary)', display: 'block' }} />

      {/* slide counter */}
      <div style={{ position: 'absolute', top: 8, right: 8, background: 'rgba(0,0,0,.6)', color: '#fff', fontSize: 11, fontWeight: 600, padding: '2px 8px', borderRadius: 12 }}>
        {i + 1} / {n}
      </div>

      {n > 1 && (
        <>
          <NavBtn side="left" onClick={() => go(-1)} />
          <NavBtn side="right" onClick={() => go(1)} />
          {/* dots */}
          <div style={{ position: 'absolute', bottom: 8, left: 0, right: 0, display: 'flex', justifyContent: 'center', gap: 5 }}>
            {slides.map((_, d) => (
              <button key={d} onClick={() => setI(d)} aria-label={`Go to slide ${d + 1}`}
                style={{ width: d === i ? 16 : 6, height: 6, borderRadius: 3, border: 'none', cursor: 'pointer', padding: 0, background: d === i ? '#fff' : 'rgba(255,255,255,.55)', transition: 'width .2s ease' }} />
            ))}
          </div>
        </>
      )}
    </div>
  )
}

function NavBtn({ side, onClick }: { side: 'left' | 'right'; onClick: () => void }) {
  const Icon = side === 'left' ? ChevronLeft : ChevronRight
  return (
    <button onClick={onClick} aria-label={side === 'left' ? 'Previous slide' : 'Next slide'}
      style={{
        position: 'absolute', top: '50%', [side]: 8, transform: 'translateY(-50%)',
        width: 30, height: 30, borderRadius: '50%', border: 'none', cursor: 'pointer',
        background: 'rgba(0,0,0,.55)', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center',
      } as React.CSSProperties}>
      <Icon size={18} />
    </button>
  )
}
