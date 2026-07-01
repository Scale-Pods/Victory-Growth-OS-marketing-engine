import { useCallback, useEffect, useRef, useState } from 'react'
import Cropper from 'react-easy-crop'
import type { Area } from 'react-easy-crop'
import { X, RotateCw, Download, Check, Loader2, Sun, Contrast, Droplet, RefreshCw } from 'lucide-react'
import { PlatformBadge } from './mediaUi'
import { uploadEditedMedia } from '../lib/content'

// ───────────────────────── Platform + aspect presets ─────────────────────────

type Ratio = { name: string; value: number }
type Platform = { id: string; label: string; ratios: Ratio[] }

export const PLATFORMS: Platform[] = [
  { id: 'instagram', label: 'Instagram', ratios: [{ name: 'Feed 1:1', value: 1 }, { name: 'Portrait 4:5', value: 4 / 5 }, { name: 'Story/Reel 9:16', value: 9 / 16 }] },
  { id: 'facebook', label: 'Facebook', ratios: [{ name: 'Feed 1:1', value: 1 }, { name: 'Landscape 1.91:1', value: 1.91 }, { name: 'Story 9:16', value: 9 / 16 }] },
  { id: 'linkedin', label: 'LinkedIn', ratios: [{ name: 'Square 1:1', value: 1 }, { name: 'Landscape 1.91:1', value: 1.91 }] },
  { id: 'tiktok', label: 'TikTok', ratios: [{ name: 'Vertical 9:16', value: 9 / 16 }] },
  { id: 'youtube', label: 'YouTube Shorts', ratios: [{ name: 'Vertical 9:16', value: 9 / 16 }] },
  { id: 'blog', label: 'Website Blog', ratios: [{ name: 'Featured 16:9', value: 16 / 9 }, { name: 'Wide 1.91:1', value: 1.91 }] },
]

// ───────────────────────── Canvas crop util (bakes rotation + filters) ─────────────────────────

function loadImage(url: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image()
    img.crossOrigin = 'anonymous'
    img.onload = () => resolve(img)
    img.onerror = reject
    img.src = url + (url.includes('?') ? '&' : '?') + 'cb=' + Date.now()
  })
}

type Filters = { brightness: number; contrast: number; saturation: number }
const FILTER_DEFAULT: Filters = { brightness: 100, contrast: 100, saturation: 100 }
const filterCss = (f: Filters) => `brightness(${f.brightness}%) contrast(${f.contrast}%) saturate(${f.saturation}%)`

async function getCroppedBlob(src: string, area: Area, rotation: number, filters: Filters): Promise<Blob | null> {
  const image = await loadImage(src)
  const rad = (rotation * Math.PI) / 180
  const sin = Math.abs(Math.sin(rad))
  const cos = Math.abs(Math.cos(rad))
  const bW = image.width * cos + image.height * sin
  const bH = image.width * sin + image.height * cos

  const canvas = document.createElement('canvas')
  const ctx = canvas.getContext('2d')!
  canvas.width = bW
  canvas.height = bH
  ctx.translate(bW / 2, bH / 2)
  ctx.rotate(rad)
  ctx.translate(-image.width / 2, -image.height / 2)
  ctx.drawImage(image, 0, 0)

  const out = document.createElement('canvas')
  const octx = out.getContext('2d')!
  out.width = Math.round(area.width)
  out.height = Math.round(area.height)
  octx.filter = filterCss(filters)
  octx.drawImage(canvas, area.x, area.y, area.width, area.height, 0, 0, area.width, area.height)

  return new Promise((res) => out.toBlob((b) => res(b), 'image/png', 0.95))
}

// ───────────────────────── Editor ─────────────────────────

export function MediaEditor({ src, itemId, caption, onClose, onSaved }: {
  src: string; itemId: string; caption?: string | null
  onClose: () => void; onSaved: (url: string) => void
}) {
  const [platformIdx, setPlatformIdx] = useState(0)
  const [ratioIdx, setRatioIdx] = useState(0)
  const [crop, setCrop] = useState({ x: 0, y: 0 })
  const [zoom, setZoom] = useState(1)
  const [rotation, setRotation] = useState(0)
  const [filters, setFilters] = useState<Filters>(FILTER_DEFAULT)
  const [area, setArea] = useState<Area | null>(null)
  const [preview, setPreview] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)
  const [err, setErr] = useState<string | null>(null)
  const previewRef = useRef<string | null>(null)

  const platform = PLATFORMS[platformIdx]
  const ratio = platform.ratios[Math.min(ratioIdx, platform.ratios.length - 1)]
  const aspect = ratio.value

  useEffect(() => { setRatioIdx(0) }, [platformIdx])

  const onCropComplete = useCallback((_: Area, px: Area) => setArea(px), [])

  // regenerate the platform-preview thumbnail when the crop/filters settle
  useEffect(() => {
    if (!area) return
    let cancelled = false
    getCroppedBlob(src, area, rotation, filters).then((blob) => {
      if (cancelled || !blob) return
      if (previewRef.current) URL.revokeObjectURL(previewRef.current)
      const u = URL.createObjectURL(blob)
      previewRef.current = u
      setPreview(u)
    }).catch(() => {})
    return () => { cancelled = true }
  }, [area, rotation, filters, src])

  useEffect(() => () => { if (previewRef.current) URL.revokeObjectURL(previewRef.current) }, [])

  async function save(download = false) {
    if (!area) return
    setSaving(true); setErr(null)
    try {
      const blob = await getCroppedBlob(src, area, rotation, filters)
      if (!blob) throw new Error('render failed')
      if (download) {
        const a = document.createElement('a')
        a.href = URL.createObjectURL(blob)
        a.download = `${itemId}-${platform.id}-${ratio.name.replace(/[^\w]/g, '')}.png`
        a.click(); URL.revokeObjectURL(a.href)
        setSaving(false); return
      }
      const url = await uploadEditedMedia(itemId, blob, platform.id)
      setSaving(false)
      if (url) onSaved(url)
      else setErr('Save failed — the image host may block canvas export.')
    } catch (e: any) {
      setSaving(false)
      setErr('Could not process the image (cross-origin). Try again.')
    }
  }

  return (
    <div onClick={onClose} style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,.6)', backdropFilter: 'blur(4px)', zIndex: 120, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16 }}>
      <div onClick={(e) => e.stopPropagation()} style={{ width: 'min(960px,100%)', maxHeight: '92vh', overflowY: 'auto', background: 'var(--bg-elevated,#16181d)', border: '1px solid var(--separator)', borderRadius: 18, boxShadow: '0 30px 70px rgba(0,0,0,.5)' }}>
        {/* header */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '16px 20px', borderBottom: '1px solid var(--separator)' }}>
          <div style={{ fontSize: 16, fontWeight: 700 }}>Customize before publishing</div>
          <button onClick={onClose} style={{ marginLeft: 'auto', background: 'none', border: 'none', cursor: 'pointer', color: 'var(--label-tertiary)' }}><X size={19} /></button>
        </div>

        {/* platform selector */}
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', padding: '14px 20px 6px' }}>
          {PLATFORMS.map((p, i) => (
            <button key={p.id} onClick={() => setPlatformIdx(i)}
              style={{ padding: 3, borderRadius: 22, border: `2px solid ${i === platformIdx ? 'var(--blue)' : 'transparent'}`, background: 'none', cursor: 'pointer' }}>
              <PlatformBadge platform={p.id} />
            </button>
          ))}
        </div>
        {/* ratio presets */}
        <div style={{ display: 'flex', gap: 7, flexWrap: 'wrap', padding: '4px 20px 14px' }}>
          {platform.ratios.map((r, i) => (
            <button key={r.name} onClick={() => setRatioIdx(i)}
              style={{ padding: '5px 12px', borderRadius: 16, cursor: 'pointer', fontSize: 12, fontWeight: i === ratioIdx ? 600 : 500,
                border: `1.5px solid ${i === ratioIdx ? 'var(--blue)' : 'var(--separator)'}`, background: i === ratioIdx ? 'var(--blue)' : 'var(--fill-secondary)', color: i === ratioIdx ? '#fff' : 'var(--label-primary)' }}>{r.name}</button>
          ))}
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1.4fr 1fr', gap: 18, padding: '4px 20px 20px' }}>
          {/* left: cropper + controls */}
          <div>
            <div style={{ position: 'relative', width: '100%', height: 360, background: '#000', borderRadius: 12, overflow: 'hidden' }}>
              <Cropper
                image={src + (src.includes('?') ? '&' : '?') + 'cb=1'}
                crop={crop} zoom={zoom} rotation={rotation} aspect={aspect}
                onCropChange={setCrop} onZoomChange={setZoom} onRotationChange={setRotation}
                onCropComplete={onCropComplete}
                restrictPosition={false}
                style={{ mediaStyle: { filter: filterCss(filters) } }}
              />
            </div>

            {/* zoom + rotate */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginTop: 12 }}>
              <span style={{ fontSize: 12, color: 'var(--label-tertiary)', width: 48 }}>Zoom</span>
              <input type="range" min={1} max={3} step={0.01} value={zoom} onChange={(e) => setZoom(Number(e.target.value))} style={{ flex: 1 }} />
              <button className="btn-secondary" onClick={() => setRotation((r) => (r + 90) % 360)} style={{ fontSize: 12, padding: '5px 10px', color: 'var(--label-secondary)' }}><RotateCw size={13} style={{ verticalAlign: -2, marginRight: 4 }} />Rotate</button>
            </div>

            {/* filters */}
            <div style={{ marginTop: 12, display: 'flex', flexDirection: 'column', gap: 9 }}>
              <FilterSlider icon={Sun} label="Brightness" value={filters.brightness} onChange={(v) => setFilters((f) => ({ ...f, brightness: v }))} />
              <FilterSlider icon={Contrast} label="Contrast" value={filters.contrast} onChange={(v) => setFilters((f) => ({ ...f, contrast: v }))} />
              <FilterSlider icon={Droplet} label="Saturation" value={filters.saturation} onChange={(v) => setFilters((f) => ({ ...f, saturation: v }))} />
              <button onClick={() => { setFilters(FILTER_DEFAULT); setRotation(0); setZoom(1) }} style={{ alignSelf: 'flex-start', background: 'none', border: 'none', color: 'var(--blue)', fontSize: 12, cursor: 'pointer', padding: 0 }}><RefreshCw size={11} style={{ verticalAlign: -1, marginRight: 4 }} />Reset adjustments</button>
            </div>
          </div>

          {/* right: platform preview mockup */}
          <div>
            <div style={{ fontSize: 12, color: 'var(--label-tertiary)', marginBottom: 8, textTransform: 'uppercase', letterSpacing: '.04em' }}>Preview · {platform.label}</div>
            <PlatformMockup platform={platform.id} img={preview} aspect={aspect} caption={caption} />
          </div>
        </div>

        {/* footer */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '14px 20px', borderTop: '1px solid var(--separator)' }}>
          {err && <span style={{ fontSize: 12, color: 'var(--red)' }}>{err}</span>}
          <button className="btn-secondary" onClick={() => save(true)} disabled={saving || !area} style={{ marginLeft: 'auto', fontSize: 13, color: 'var(--label-secondary)' }}><Download size={14} style={{ verticalAlign: -2, marginRight: 5 }} />Download</button>
          <button className="btn-primary" onClick={() => save(false)} disabled={saving || !area} style={{ fontSize: 13 }}>
            {saving ? <><Loader2 size={14} style={{ verticalAlign: -2, marginRight: 6, animation: 'spin 1s linear infinite' }} />Saving…</> : <><Check size={14} style={{ verticalAlign: -2, marginRight: 6 }} />Save for {platform.label}</>}
          </button>
        </div>
      </div>
    </div>
  )
}

function FilterSlider({ icon: Icon, label, value, onChange }: { icon: typeof Sun; label: string; value: number; onChange: (v: number) => void }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
      <Icon size={14} style={{ color: 'var(--label-tertiary)', flexShrink: 0 }} />
      <span style={{ fontSize: 12, color: 'var(--label-secondary)', width: 78 }}>{label}</span>
      <input type="range" min={50} max={150} step={1} value={value} onChange={(e) => onChange(Number(e.target.value))} style={{ flex: 1 }} />
      <span style={{ fontSize: 11, color: 'var(--label-tertiary)', width: 34, textAlign: 'right' }}>{value}%</span>
    </div>
  )
}

// A lightweight platform-styled preview card
function PlatformMockup({ platform, img, aspect, caption }: { platform: string; img: string | null; aspect: number; caption?: string | null }) {
  const isBlog = platform === 'blog'
  const isVideoFrame = platform === 'tiktok' || platform === 'youtube'
  return (
    <div style={{ border: '1px solid var(--separator)', borderRadius: 12, overflow: 'hidden', background: isVideoFrame ? '#000' : 'var(--fill-secondary)' }}>
      {!isVideoFrame && !isBlog && (
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '8px 10px' }}>
          <div style={{ width: 26, height: 26, borderRadius: '50%', background: 'var(--fill-tertiary)' }} />
          <div style={{ fontSize: 12, fontWeight: 600 }}>victoryenergy</div>
          <div style={{ marginLeft: 'auto' }}><PlatformBadge platform={platform} size="sm" /></div>
        </div>
      )}
      <div style={{ position: 'relative', width: '100%', aspectRatio: String(aspect), background: 'var(--fill-tertiary)' }}>
        {img
          ? <img src={img} alt="preview" style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} />
          : <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--label-tertiary)', fontSize: 12 }}>Adjust the crop →</div>}
        {isVideoFrame && (
          <div style={{ position: 'absolute', bottom: 10, left: 10, right: 10, color: '#fff' }}>
            <div style={{ fontSize: 12, fontWeight: 700, marginBottom: 3 }}>@victoryenergy</div>
            {caption && <div style={{ fontSize: 11, opacity: .9, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>{caption}</div>}
          </div>
        )}
      </div>
      {!isVideoFrame && (
        <div style={{ padding: '8px 10px' }}>
          {isBlog && <div style={{ fontSize: 13, fontWeight: 700, marginBottom: 4 }}>Featured image · victoryenergy.us</div>}
          {caption && <div style={{ fontSize: 11.5, color: 'var(--label-secondary)', lineHeight: 1.4, display: '-webkit-box', WebkitLineClamp: 3, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>{caption}</div>}
        </div>
      )}
    </div>
  )
}
